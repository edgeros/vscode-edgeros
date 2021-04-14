/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-14 11:57:53
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as common from '../../lib/common';
import * as config from '../../lib/config';
/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let disposable = vscode.commands.registerCommand('edgeros.showAddDevView', async (...options: string[]) => {
    try {
      const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
      } else {
        currentPanel = vscode.window.createWebviewPanel('addDeviceView', 'Add Device', vscode.ViewColumn.One, {
          enableScripts: true
        });
        const webViewFileName = 'addDevice';
        let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
        //set html str
        currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
          ...assetUris
        });
        currentPanel.webview.onDidReceiveMessage(
          message => {
            if (message.type === 'addDev') {
              let devsArray: any[] = context.globalState.get(config.devsStateKey) || [];
              devsArray.push(message.data);
              context.globalState.update(config.devsStateKey, devsArray);
            }
            currentPanel?.dispose();
          },
          undefined,
          context.subscriptions
        );
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    } catch (err) {
      console.error(err);
    }
  });
  context.subscriptions.push(disposable);
};
