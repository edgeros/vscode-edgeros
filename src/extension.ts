import * as vscode from 'vscode';

import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { EdgerApi } from './edgerApi';


export function activate(context: vscode.ExtensionContext) {
	const edgerDeivceProvider = new EdgerDeivceProvider(context);
	vscode.window.registerTreeDataProvider('edgerDeviceView', edgerDeivceProvider);
	vscode.commands.registerCommand('edgerDevices.refreshEntry', () => edgerDeivceProvider.refresh());
	vscode.commands.registerCommand('edgerDevices.addEntry', () => edgerDeivceProvider.addDevice());
	vscode.commands.registerCommand('edgerDevices.editEntry', (edger: Edger) => vscode.window.showInformationMessage(`Successfully called edit entry on ${edger.description}.`));
	vscode.commands.registerCommand('edgerDevices.deleteEntry', (edger: Edger) => edgerDeivceProvider.deleteDevice(edger));

	const edgerApi = new EdgerApi(context);
	vscode.commands.registerCommand('edgerDevices.installApp', (edger: Edger) => edgerApi.install(edger));
}

export function deactivate() { }