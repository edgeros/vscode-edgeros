/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-21 15:21:03
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from "fs-extra";
import buildEap from "../../generate/eapBuild";
import * as config from "../../lib/config";
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.buildEap', async (...options: string[]) => {
    // console.log("触发指令后参数", options);
    // vscode.window.showInformationMessage('Hello World from edgeros!');
    if (vscode.workspace.workspaceFolders) {
      if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
        let configInfo: any = context.globalState.get(config.edgerosCfgKey);
        let eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
          configInfo: configInfo
        });
        vscode.window.showInformationMessage('build eap:', eapPath);
      } else {
        vscode.window.showErrorMessage('No edgeros project');
      }
    }
  });
  context.subscriptions.push(disposable);
};