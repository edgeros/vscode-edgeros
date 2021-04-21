/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 14:58:39 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-10 18:29:40
 */

import * as vscode from 'vscode';
import registers from './registers';
import * as fs from 'fs';
import * as path from 'path';

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

	// puglin init data
	fs.writeFileSync(path.join(__dirname, '../log/error.txt'),'###This is the HTTP request error logging file###\r\n')
}

// this method is called when your extension is deactivated
export function deactivate() { }
