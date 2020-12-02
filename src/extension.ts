/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: extension.ts, extension main file.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.file })();
import * as vscode from 'vscode';
import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { EdgerApi } from './edgerApi';


process.on('uncaughtException', function (err) {
  console.error( err);
});

export function activate(context: vscode.ExtensionContext) {
	const edgerDeivceProvider = new EdgerDeivceProvider(context);
	vscode.window.registerTreeDataProvider('edgerDeviceView', edgerDeivceProvider);
	vscode.commands.registerCommand('edgerDevices.refreshDevice', () => edgerDeivceProvider.refresh());
	vscode.commands.registerCommand('edgerDevices.addDevice', () => edgerDeivceProvider.addDevice());
	vscode.commands.registerCommand('edgerDevices.updateDevice', (edger: Edger) => edgerDeivceProvider.updateDevice(edger));
	vscode.commands.registerCommand('edgerDevices.deleteDevice', (edger: Edger) => edgerDeivceProvider.deleteDevice(edger));
	vscode.commands.registerCommand('edgerDevices.openConsole', (edger: Edger) => edgerDeivceProvider.openConsole(edger));
	const edgerApi = new EdgerApi(context);
	vscode.commands.registerCommand('edgerDevices.installApp', (edger: Edger) => edgerApi.install(edger));
	vscode.commands.registerCommand('edgerDevices.archive', () => edgerApi.archive());
}

export function deactivate() { }