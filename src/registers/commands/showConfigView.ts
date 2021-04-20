/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-20 20:29:00
 */
import * as vscode from 'vscode';
import * as config from '../../lib/config';
import * as ejs from 'ejs';
import * as common from '../../lib/common';
import * as path from 'path';
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.setConfig', async (...options: any[]) => {

    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel('setConfigView', 'config', vscode.ViewColumn.One, {
        enableScripts: true
      });
      // set title icon
      currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);
      // set html/js path
      let webViewFileName = 'setConfig';
      // get vue,element,css uri
      let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
      // set html 
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris,
      });


      //reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {
        console.log("message");
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