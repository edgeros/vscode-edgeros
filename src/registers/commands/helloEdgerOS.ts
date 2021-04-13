/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-12 20:02:29
 */
import * as vscode from 'vscode';
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.helloEdgerOS', (...options: string[]) => {
    console.log("触发指令后参数", options);
    vscode.window.showInformationMessage('Hello World from edgeros!');
  });
  context.subscriptions.push(disposable);
};