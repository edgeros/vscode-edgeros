
import AdmZip = require('adm-zip');
import { InputBoxOptions, ExtensionContext, commands, window, workspace } from 'vscode';
import axios from "axios";
import FormData = require('form-data');
import * as fs from "fs";

export function activate(context: ExtensionContext) {
	let disposable = commands.registerCommand('edgeros.installApp', async () => {
		let edger_ip = '';
		let options: InputBoxOptions = {
			prompt: "Edger Device IP Address.",
			placeHolder: "(edger device ip)"
		};
		await window.showInputBox(options).then(value => {
			if (!value) { return; }

			edger_ip = value;
			console.log(`Edger device ip: ${edger_ip}`);
		});

		// compress files as an EAP archive
		var eap = new AdmZip();
		var eap_path = '';
		try {
			if (!edger_ip || !workspace.workspaceFolders) { return; }

			var projectRootFolder = workspace.workspaceFolders[0].uri.fsPath;
			console.log(`workspace path: ${projectRootFolder}`);
			eap.addLocalFolder(projectRootFolder);
			eap_path = projectRootFolder + "/edger.eap";
			eap.writeZip(eap_path);
			console.log('making eap succeeded.');
		} catch (error) {
			console.log(`making eap failed: ${error}`);
		}

		// upload eap to edger device
		const form = new FormData();
		form.append('eap', fs.createReadStream(eap_path));

		const uploadApiConfig = {
			baseURL: `http://${edger_ip}:82/`,
			auth: {
				username: 'edger',
				password: '630010'
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
			baseURL: `http://${edger_ip}:82/`,
			auth: {
				username: 'edger',
				password: '783533'
			},
			headers: {
				common: {
					"Content-Type": "application/json",
				},
			},
		};
		await axios.post('/install', { eap: 'edger.eap' }, installApiConfig)
			.then(function (response) {
				console.log(`eap installatiioin succeeded: ${response}`);
			})
			.catch(function (error) {
				console.log(`eap installation failed: ${error}`);
			});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
