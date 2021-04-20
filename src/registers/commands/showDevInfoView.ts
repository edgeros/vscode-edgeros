/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-20 14:48:35
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as common from '../../lib/common';
import * as config from '../../lib/config';
import { EOSTreeItem } from '../../lib/class/EOSTreeItem';
/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let deviceInfo: { devName: string, devIp: string, devPwd: string } | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showDevInfoView', async (...options: EOSTreeItem[]) => {
    try {
      let devsArray: any[] = context.globalState.get(config.devsStateKey) || [];
      let tmpDevInfo = devsArray.find(item => {
        return item.devName === options[0].label;
      });
      if (deviceInfo?.devIp !== tmpDevInfo.devIp) { currentPanel?.dispose(); deviceInfo = tmpDevInfo; }

      const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
      } else {
        currentPanel = vscode.window.createWebviewPanel('devInfoView', 'Device Info', vscode.ViewColumn.One, {
          enableScripts: true
        });
        const webViewFileName = 'deviceInfo';
        let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
        //set html str
        currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
          ...assetUris
        });
        currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);
        currentPanel.webview.onDidReceiveMessage(
          async message => {
            // update Device
            if (message.type === 'update') {
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
