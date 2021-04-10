/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-10 17:31:44
 */
import * as vscode from 'vscode';
/**
 *command:  edgeros.helloWorld
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from edgeros!');
  });
  context.subscriptions.push(disposable);
};