/*
 * @Author: FuWenHao  
 * @Date: 2021-04-15 20:30:11 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-15 20:59:48
 */

// edgeros.showWebView
import * as vscode from 'vscode';
import * as config from '../../lib/config';
import * as ejs from 'ejs';

export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showWebView', async (...options: string[]) => {
    currentPanel = vscode.window.createWebviewPanel('showWebView', options[0], vscode.ViewColumn.One, {
      enableScripts: true
    });
    currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);
    currentPanel.webview.html = ejs.render(iframeTmp, {
      openUrl: 'https://docs.t.e0a.cc/edgeros/api/overview.html'
    });
  });
  context.subscriptions.push(disposable);
};


let iframeTmp = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
<div style="display:flex;width:100%;height:100%;flex-direction: column;">
<!-- <iframe src ="<%=openUrl%>" onload="this.width=window.innerWidth;this.height=window.innerHeight;" />-->
   <iframe src ="<%=openUrl%>" width="100%" height:"100%" /> 
</div>
   </body>
</html>`;