/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 14:58:39 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-21 20:17:02
 */

import * as vscode from 'vscode';
import registers from './registers';
import * as fs from 'fs';
import * as path from 'path';
import nlsConfig from './lib/nls';

// The example uses the file message format.
let localize = nlsConfig(__filename);

export function activate(context: vscode.ExtensionContext) {
	console.log("[EdgerOS Plugin] Start");
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
