/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 14:58:39 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-10 17:33:28
 */

import * as vscode from 'vscode';
import registers from './registers';

export function activate(context: vscode.ExtensionContext) {
	console.log("[edgeros pulgin] start");
	for (let command in registers.commands) {
		registers.commands[command](context);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
