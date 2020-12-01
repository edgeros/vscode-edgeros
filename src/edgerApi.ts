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

import FormData = require('form-data');
import * as vscode from 'vscode';
import * as fs from "fs";
import axios from "axios";
import * as path from 'path'

import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { edger_ide_port, eap_desc_json_file_name } from './constants';
import { WorkspaceApi } from './workspaceApi';
import { ZipAsync } from './zipeap';
import { EventEmitter } from 'events';
import { EdgerProgress } from './progress';

export class EdgerApi extends EventEmitter {
	_context: vscode.ExtensionContext;
	_edgerDeviceProvider: EdgerDeivceProvider;
	_workspace: WorkspaceApi;
	_progress: EdgerProgress;

	constructor(context: vscode.ExtensionContext) {
		super();
		this._context = context;
		this._edgerDeviceProvider = new EdgerDeivceProvider(context);
		this._workspace = new WorkspaceApi(context);
		this._progress = new EdgerProgress(this);
	}

	async install(edger: Edger): Promise<void> {
		const edger_ip: string = edger.deviceIP;
		if (!edger_ip || !vscode.workspace.workspaceFolders) {
			return;
		}

		var projectRootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		// check if app's desc.json is valid
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
		let eap_name = vscode.workspace.name + '.eap';
		const {dir, name} = path.parse(projectRootFolder);
		const eap_file_path = path.join(dir, eap_name);
	 
		try {
			console.log(`workspace path: ${dir}/${name}`);
			const zipRes = await ZipAsync(dir, eap_file_path, [name], this._progress);
       if(!zipRes){
           throw new Error('zip error.');
			 }
			 console.log('making eap succeeded.');
		} catch (error) {
			console.log(`making eap failed: ${error}`);
		}

		// upload eap to edger device
		await this.uploadEap(eap_file_path, edger_ip, dev_pass).then(() => {
			vscode.window.showInformationMessage('Upload completed.');
		}).catch((err) => {
			vscode.window.showErrorMessage(`Upload failed - ${err.message}`);
		});
		// install/update eap on edger device
		await this.installEap(edger_ip, dev_pass, eap_name).then(() => {
			vscode.window.showInformationMessage('Installation completed.');
		}).catch((err) => {
			vscode.window.showErrorMessage(`Installation failed - ${err.message}`);
		});
	}

	private async uploadEap(eap_path: string, edger_ip: string, dev_pass: string) {
		const form = new FormData();
		form.append('eap', fs.createReadStream(eap_path));
		console.log(`device pass is: ${dev_pass}`);
		const uploadApiConfig = {
			baseURL: `http://${edger_ip}:${edger_ide_port}/`,
			auth: {
				username: 'edger',
				password: dev_pass
			},
			headers: form.getHeaders()
		};
		await axios.post('/upload', form, uploadApiConfig)
			.then(function (response) {
				console.log(`Upload succeeded: ${response}`);
			})
			.catch(function (err) {
				console.log(`Upload failed: ${err}`);
				throw new Error(err);
			});
	}

	private async installEap(edger_ip: string, dev_pass: string, eap_name: string) {
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
			eap: eap_name
		}, installApiConfig)
			.then(function (response) {
				console.log(`Installation succeeded: ${response}`);
			})
			.catch(function (err) {
				console.log(`Installation failed: ${err}`);
				throw new Error(err);
			});
	}
} 