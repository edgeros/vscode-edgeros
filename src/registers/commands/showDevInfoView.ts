/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-22 16:31:58
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as common from '../../lib/common';
import * as config from '../../lib/config';
import { EOSTreeItem } from '../../lib/class/EOSTreeItem';
import nlsConfig from '../../lib/nls';
const localize = nlsConfig(__filename);

/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let deviceInfo: { devName: string, devIp: string, devPwd: string, devLoginPwd: string } | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showDevInfoView', async (...options: EOSTreeItem[]) => {
    try {
      let devsArray: any[] = context.globalState.get(config.devsStateKey) || [];
      let tmpDevInfo = devsArray.find(item => {
        return item.devName === options[0].label;
      });
      if (deviceInfo?.devIp !== tmpDevInfo.devIp) { currentPanel?.dispose(); }
      deviceInfo = tmpDevInfo;
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
          ...assetUris,
          language: {
            devIpTxt: localize('devIp.txt', 'Device IP'),
            devNameTxt: localize('devName.txt', 'Device Name'),
            devPwdTxt: localize('devPwd.txt', 'Device Password'),
            devLoginPwdText: localize('devLoginPwd.txt', 'Device Login Password'),
            devUpdate: localize("devUpdate.txt", 'Update'),
            devDelete: localize("devDelete.txt", 'Delete'),
            ipNotEmptyText: localize('ipNotEmpty.txt', "IP Not Empty"),
            ipExistText: localize('ipNotEmpty.Text', "IP Not Empty"),
            ipIncorrectFormatText: localize('ipIncorrectFormat.Text', "IP Incorrect Format"),
            devNameNotEmptyText: localize('devNameNotEmpty.Text', "Device Name Not Empty"),
            devNameExistText: localize('devNameExist.Text', "Device Name Exist"),
            devDeleteHintTitleText: localize("devDeleteHintTitle.Text", "Hint"),
            devDeleteHintContextText: localize("devDeleteHintContext.Text", "Are you sure to delete this device?"),
            devDeleteHintYesButtonText: localize("devDeleteHintYesButton.Text", "Confirm"),
            devDeleteHintNoButtonText: localize("devDeleteHintNoButton.Text", "Cancel")
          }
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
