/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-13 17:46:14
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as common from '../../lib/common';
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
        let vueJsUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'lib', 'vue.js'));
        let elementUiJsUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'lib', 'element-ui.js'));
        let ttfUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'lib', 'fonts', 'element-icons.ttf'));
        let woffUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'lib', 'fonts', 'element-icons.woff'));

        let cssStr = await ejs.renderFile(path.join(context.extensionPath, 'resources', 'view', 'lib', 'element-ui.css'), {
          ttfUri,
          woffUri
        });
        fs.writeFileSync(path.join(context.extensionPath, 'resources', 'view', 'lib', 'bk_element-ui.css'), cssStr);

        let elementUiCssUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'lib', 'bk_element-ui.css'));

        let indexJs = common.changeUri(currentPanel, path.join(context.extensionPath, 'resources', 'view', 'addDevice', 'index.js'));
        //set html str
        currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'resources', 'view', 'addDevice', 'view.ejs'), {
          vueJsUri,
          indexJs,
          elementUiCssUri,
          elementUiJsUri
        });


        currentPanel.webview.onDidReceiveMessage(
          message => {
            console.log("Message>>>", message);
          },
          undefined,
          context.subscriptions
        );
      }
    } catch (err) {
      console.error(err);
    }
  });
  context.subscriptions.push(disposable);
};

