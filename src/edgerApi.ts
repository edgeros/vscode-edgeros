/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: edgerApi.ts, Edger API client.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */

import AdmZip = require('adm-zip');
import FormData = require('form-data');
import * as vscode from 'vscode';
import * as fs from "fs";
import axios from "axios";

import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { edger_ide_port } from './constants';
import { WorkspaceApi } from './workspaceApi';

export class EdgerApi {
	_context: vscode.ExtensionContext;
	_edgerDeviceProvider: EdgerDeivceProvider;
	_workspace: WorkspaceApi;

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
		this._edgerDeviceProvider = new EdgerDeivceProvider(context);
		this._workspace = new WorkspaceApi(context);
	}

	async install(edger: Edger): Promise<void> {
		const edger_ip: string = edger.deviceIP;
		if (!edger_ip || !vscode.workspace.workspaceFolders) {
			return;
		}

		var projectRootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		// TODO: check app desc.json
		await this._workspace.checkDescJson(projectRootFolder).then(undefined, (err) => {
			console.log(err);
			throw new Error(err);
		});

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
		// save device password
		this._edgerDeviceProvider.updatePassword(edger, dev_pass);

		// compress files as an EAP archive
		var eap = new AdmZip();
		var eap_path = '';
		try {
			console.log(`workspace path: ${projectRootFolder}`);
			eap.addLocalFolder(projectRootFolder);
			eap_path = projectRootFolder + '/' + vscode.workspace.name + ".eap";
			eap.writeZip(eap_path);
			console.log('making eap succeeded.');
		} catch (error) {
			console.log(`making eap failed: ${error}`);
		}

		// upload eap to edger device
		await this.uploadEap(eap_path, edger_ip, dev_pass);
		// install/update eap on edger device
		await this.installEap(edger_ip, dev_pass);
	}

	private async uploadEap(eap_path: string, edger_ip: string, dev_pass: string) {
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
			.then(function (response) {
				console.log(`eap upload succeeded: ${response.statusText}`);
			})
			.catch(function (error) {
				console.log(`eap upload failed: ${error.statusText}`);
			});
	}

	private async installEap(edger_ip: string, dev_pass: string) {
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