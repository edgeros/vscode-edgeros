/*
 * @Author: FuWenHao
 * @Date: 2021-04-15 20:30:11
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-05-14 17:53:56
 */

// edgeros.showWebView
import * as vscode from 'vscode'
import * as config from '../../config'
import * as ejs from 'ejs'

export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined

  const disposable = vscode.commands.registerCommand('edgeros.showWebView', async (...options: any[]) => {
    currentPanel = vscode.window.createWebviewPanel('showWebView', options[0], vscode.ViewColumn.One, {
      enableScripts: true
    })

    // set title icon
    currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo)
    currentPanel.title = options[0].showTitle
    currentPanel.webview.html = ejs.render(iframeTmp, {
      openUrl: options[0].url
    })
  })
  context.subscriptions.push(disposable)
};

const iframeTmp = `
<!DOCTYPE html>
<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
    <div id="webIframe onload="this.width=window.innerWidth;this.height=window.innerHeight" >
      <iframe src ="<%=openUrl%>" id="webIframe" frameborder="0" height="100%" width="100%"></iframe>
    </div>
  </body>
  <script>
   var wifm= document.getElementById("webIframe");
   wifm.height = window.innerHeight-15;
   wifm.width = window.innerWidth-20;
   
   window.onresize = function(){
    wifm.height = window.innerHeight-15;
    wifm.width = window.innerWidth-20;
   }
  </script>
</html>
`
