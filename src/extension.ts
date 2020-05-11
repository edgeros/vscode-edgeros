import * as vscode from 'vscode';

import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { EdgerApi } from './edgerApi';


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
}

export function deactivate() { }