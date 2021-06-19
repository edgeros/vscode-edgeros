/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-03 20:43:22
 */
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs-extra'
import buildEap from '../../generate/eapBuild'
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.buildEap', async (...options: string[]) => {
    try {
      if (vscode.workspace.workspaceFolders) {
        if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
          const configInfo: any = {
            buildSuffix: vscode.workspace.getConfiguration('edgeros').get('buildType'),
            increment: vscode.workspace.getConfiguration('edgeros').get('versionIncrement')
          }

          const eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
            configInfo: configInfo
          })
          vscode.window.showInformationMessage('Build EdgerOS App:' + eapPath)
        } else {
          vscode.window.showErrorMessage('No Edgeros Project')
        }
      }
    } catch (err) {
      console.log(err)
      vscode.window.showErrorMessage(err.message)
    }
  })
  context.subscriptions.push(disposable)
};
