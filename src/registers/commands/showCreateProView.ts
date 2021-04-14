/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-14 20:23:49
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as common from '../../lib/common';
/**
 *command:  edgeros.showCreateProView
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showCreateProView', async (...options: string[]) => {
    console.log("触发指令后参数", options);
    // vscode.window.showInformationMessage('Hello World from edgeros!');
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel('createProject', 'create Project', vscode.ViewColumn.One, {
        enableScripts: true
      });
      //set html/js path
      let webViewFileName = 'createProject';
      // get vue,element,css uri
      let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
      // set html 
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris
      });

      //reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {

      });
      // webview close trigger
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }


  });
  context.subscriptions.push(disposable);
};