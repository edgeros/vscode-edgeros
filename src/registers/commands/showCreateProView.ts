/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-15 20:20:32
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as common from '../../lib/common';
import * as config from '../../lib/config';
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

      currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);

      //set html/js path
      let webViewFileName = 'createProject';
      // get vue,element,css uri
      let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
      //  get css uri
      let cssUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'));
      // set html 
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris, cssUri
      });

      //reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {
        if (message.type === 'selectSavePath') {
          let selectSavePath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: '请选择项目保存目录',
            openLabel: '选择'
          });
          if (selectSavePath) {
            currentPanel?.webview.postMessage({
              type: '_selectSavePath',
              data: selectSavePath[0].fsPath
            });
          }
        } else if (message.type === 'createProject') {
          console.log(message.data);
          currentPanel?.webview.postMessage({
            type: '_createProject',
            data: 'success'
          });
        }
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