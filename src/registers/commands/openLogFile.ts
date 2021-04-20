/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-20 19:35:42
 */
import * as vscode from 'vscode';
import * as path from 'path';
/**
 *command:  edgeros.openLogFile
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.openLogFile', (...options: string[]) => {
    let LogFileUri = vscode.Uri.file(path.join(__dirname, '../../../log/error.txt'));
    vscode.window.showTextDocument(LogFileUri);
  });
  context.subscriptions.push(disposable);
};