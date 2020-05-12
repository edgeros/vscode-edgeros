
import AdmZip = require('adm-zip');
import FormData = require('form-data');
import * as vscode from 'vscode';
import * as fs from "fs";
import axios from "axios";

import { Edger } from './edgerDeviceProvider';
import { edger_key, edger_ide_port } from './contants';

export class EdgerApi {
	_context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
	}

	async install(edger: Edger): Promise<void> {
		// ask for device password
		let pass_options: vscode.InputBoxOptions = {
			value: edger ? edger.devicePass : '',
			prompt: "Edger Device Password.",
			placeHolder: "(device password)"
		};
		const dev_pass = await vscode.window.showInputBox(pass_options);
		if (dev_pass === undefined) {
			console.log('Installation cancelled.');
			return;
		}

		const edger_ip: string = edger.deviceIP;
		console.log('edger_key:' + edger_key);

		// compress files as an EAP archive
		var eap = new AdmZip();
		var eap_path = '';
		try {
			if (!edger_ip || !vscode.workspace.workspaceFolders) {
				return;
			}

			var projectRootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
			console.log(`workspace path: ${projectRootFolder}`);
			eap.addLocalFolder(projectRootFolder);
			eap_path = projectRootFolder + '/' + vscode.workspace.name + ".eap";
			eap.writeZip(eap_path);
			console.log('making eap succeeded.');
		} catch (error) {
			console.log(`making eap failed: ${error}`);
		}

		// upload eap to edger device
		const form = new FormData();
		form.append('eap', fs.createReadStream(eap_path));

		const uploadApiConfig = {
			baseURL: `http://${edger_ip}:${edger_ide_port}/`,
			auth: {
				username: 'edger',
				password: dev_pass
			},
			headers: form.getHeaders(),
		};
		await axios.post('/upload', form, uploadApiConfig)
			.then(
				function (response) {
					console.log(`eap upload succeeded: ${response.statusText}`);
				})
			.catch(function (error) {
				console.log(`eap upload failed: ${error.statusText}`);
			});

		// install/update eap on edger device
		const installApiConfig = {
			baseURL: `http://${edger_ip}:${edger_ide_port}/`,
			auth: {
				username: 'edger',
				password: dev_pass
			},
			headers: {
				common: {
					"Content-Type": "application/json",
				},
			},
		};
		await axios.post('/install', {
			eap: 'edger.eap'
		}, installApiConfig)
			.then(function (response) {
				console.log(`eap installatiioin succeeded: ${response}`);
			})
			.catch(function (error) {
				console.log(`eap installation failed: ${error}`);
			});
	}
} 