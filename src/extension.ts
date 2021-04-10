/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 14:58:39 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-10 18:29:40
 */

import * as vscode from 'vscode';
import registers from './registers';

export function activate(context: vscode.ExtensionContext) {
	console.log("[edgeros plugin] start");
	// registers all command
	for (let command in registers.commands) {
		registers.commands[command](context);
	}

	// registers all providers
	for (let provider in registers.providers) {
		registers.providers[provider](context);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
