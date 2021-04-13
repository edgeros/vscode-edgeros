/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-12 20:53:15
 */
import * as vscode from 'vscode';
/**
 *command:  edgeros.showCreateProView
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.showCreateProView', (...options: string[]) => {
    console.log("触发指令后参数", options);
    // vscode.window.showInformationMessage('Hello World from edgeros!');
    const panel = vscode.window.createWebviewPanel('CatCoding', 'Cat Coding', vscode.ViewColumn.One, {});
  });
  context.subscriptions.push(disposable);
};