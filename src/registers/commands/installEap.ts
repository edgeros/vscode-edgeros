/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : installEap.ts
 * Desc   : implement VSCode command to install EdgerOS app.
 */
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs-extra'

import buildEap from '../../generate/eapBuild'
import { EOSTreeItem } from '../../lib/class/EOSTreeItem'
import { devsStateKey } from '../../lib/config'
import { uploadEap, installEap } from '../../lib/common'
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.installEap', async (...options: EOSTreeItem[]) => {
    try {
      if (vscode.workspace.workspaceFolders) {
        if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
          try {
            // get egeros config
            const configInfo: any = {
              buildSuffix: vscode.workspace.getConfiguration('edgeros').get('buildSuffix'),
              increment: vscode.workspace.getConfiguration('edgeros').get('versionIncrement')
            }
            let eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
              configInfo: configInfo
            })
            const devList: any[] | undefined = context.globalState.get(devsStateKey)
            const devInfo = devList?.find(item => {
              return item.devName === options[0].label
            })

            const installType = vscode.workspace.getConfiguration('edgeros').get('installEAP')
            // 弹出选择框
            if (installType === 'Manual') {
              const eapNames: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'EdgerOS App': ['zip', 'eap']
                }
              })
              if (eapNames) {
                eapPath = eapNames[0].fsPath
              } else {
                throw new Error('File selection cancelled')
              }
            } else if (installType === 'Auto') {
              // 不做处理
            }

            // Progress 动效
            await vscode.window.withProgress({
              location: vscode.ProgressLocation.Window,
              title: 'EdgerOS',
              cancellable: false
            }, async (progress, token) => {
              progress.report({ message: 'Upload EdgerOS App' })
              await uploadEap(eapPath, devInfo.devIp, devInfo.devPwd)
              progress.report({ message: 'Install EdgerOS App' })
              const installMsg = await installEap(eapPath.split(path.sep).pop() as string, devInfo.devIp, devInfo.devPwd)
              return installMsg
            })
            vscode.window.showInformationMessage('Install app success')
          } catch (err) {
            vscode.window.showErrorMessage('Install EdgerOS App : ' + err)
          }
        } else {
          vscode.window.showErrorMessage('No edgeros project')
        }
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message)
    }
  })
  context.subscriptions.push(disposable)
};
