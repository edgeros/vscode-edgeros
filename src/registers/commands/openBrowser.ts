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
  let disposable = vscode.commands.registerCommand('edgeros.openBrowser', (...options: string[]) => {
    let url: string = (options[0] as any).options.url;
    vscode.env.openExternal(vscode.Uri.parse(url));
  });
  context.subscriptions.push(disposable);
};