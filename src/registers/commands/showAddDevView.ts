/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-15 20:20:52
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
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let deviceInfo: { devName: string, devIp: string, devPwd: string } | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showAddDevView', async (...options: string[]) => {
    try {
      let devsArray: any[] = context.globalState.get(config.devsStateKey) || [];
      if (options.length > 0) {
        let tmpDevInfo = devsArray.find(item => {
          return item.devName === options[0];
        });

        if (deviceInfo?.devIp !== tmpDevInfo.devIp) { currentPanel?.dispose(); deviceInfo = tmpDevInfo; }
      } else {
        if (deviceInfo) { deviceInfo = undefined; currentPanel?.dispose(); }
      }
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
        currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);
        currentPanel.webview.onDidReceiveMessage(
          async message => {
            // add Device
            if (message.type === 'addDev') {
              devsArray.push(message.data);
              await context.globalState.update(config.devsStateKey, devsArray);
              await vscode.commands.executeCommand('edgeros.refreshThreeView');
              currentPanel?.dispose();
            }
            // update Device
            else if (message.type === 'update') {
              devsArray = devsArray.map(item => {
                if (item.devIp === message.data.devIp) {
                  item = message.data;
                }
                return item;
              });
              await context.globalState.update(config.devsStateKey, devsArray);
              await vscode.commands.executeCommand('edgeros.refreshThreeView');
              currentPanel?.dispose();
            }
            // delete devoce
            else if (message.type === 'delete') {
              devsArray = devsArray.filter(item => {
                return !(item.devIp === message.data.devIp && item.devName === message.data.devName);
              });
              await context.globalState.update(config.devsStateKey, devsArray);
              await vscode.commands.executeCommand('edgeros.refreshThreeView');
              currentPanel?.dispose();
            }
            // return device List
            else if (message.type === 'getDeviceData') {
              currentPanel?.webview.postMessage({
                type: '_getDeviceData',
                data: {
                  devices: devsArray,
                  deviceInfo: deviceInfo,
                }
              });
            }

          },
          undefined,
          context.subscriptions
        );
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
            deviceInfo = undefined;
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
