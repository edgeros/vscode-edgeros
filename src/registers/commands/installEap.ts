/**
 * Copyright (c) 2022 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2023-01-30 12:10:09
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2023-03-07 16:29:31
 */

import * as vscode from 'vscode'
import * as path from 'path'
import buildEap from '../../generate/eapBuild'
import { EdgerosTreeItem } from '../../components/treeItem'
import { uploadEap, installEap } from '../../utility/edgerosApi'
import { selectedDevice, getWorkspaceSettings, selectBuildPath } from '../../common'
import { assert } from '../../errors'

export = function (context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('edgeros.installEap',
    (...options: EdgerosTreeItem[]) => {
      return install(context, options)
    })
  )

  context.subscriptions.push(vscode.commands.registerCommand('edgeros.installFromEapFile',
    (...options: EdgerosTreeItem[]) => {
      return install(context, options, true)
    })
  )
};

async function install (context: vscode.ExtensionContext, options: EdgerosTreeItem[], selectFile = false) {
  try {
    const workspaceSettings = getWorkspaceSettings()

    try {
      const insideWorkspace = vscode.workspace.workspaceFolders
      const devInfo = assert(await selectedDevice(context, options), 'No EdgerOS device is selected')

      let eapPath: string
      // 弹出选择框
      if (selectFile || workspaceSettings.installEAP === 'Manual' || !insideWorkspace) {
        eapPath = await selectEapFile()
      } else if (workspaceSettings.installEAP === 'Auto') {
        const projectDir = await selectBuildPath(context)
        eapPath = await buildEap(projectDir, {
          configInfo: workspaceSettings
        })
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
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message)
  }
}

async function selectEapFile () {
  const eapNames = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { // eslint-disable-next-line @typescript-eslint/naming-convention
      'EdgerOS App': ['zip', 'eap']
    }
  })
  if (!eapNames) {
    throw new Error('File selection cancelled')
  }
  return eapNames[0].fsPath
}
