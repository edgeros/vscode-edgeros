/*
 * @Author: FuWenHao
 * @Date: 2021-05-31 15:07:46
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-05-31 19:04:00
 */

import * as vscode from 'vscode'
import * as fs from 'fs-extra'
import * as path from 'path'
import buildEap from '../../generate/eapBuild'
import { EOSTreeItem } from '../../lib/class/EOSTreeItem'
import { uploadEap, installEap } from '../../lib/common'
import { getGlobalState } from '../../common'

/**
 *command:  edgeros.testEap
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.installTestEap', async (...options: EOSTreeItem[]) => {
    try {
      if (vscode.workspace.workspaceFolders) {
        const eosJsonPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json')
        delete require.cache[require.resolve(eosJsonPath)]
        const eosJson = require(eosJsonPath)

        if (!eosJson.test) {
          vscode.window.showErrorMessage('未发现测试脚本入口,edgeros.json中 test属性')
          return
        }

        if (!fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, eosJson.test))) {
          vscode.window.showErrorMessage('没有找到test文件:' + eosJson.test)
          return
        }

        const configInfo: any = {
          buildSuffix: vscode.workspace.getConfiguration('edgeros').get('buildSuffix'),
          increment: vscode.workspace.getConfiguration('edgeros').get('versionIncrement')
        }
        // 构建测试eap
        const eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
          configInfo: configInfo,
          buildType: 'test'
        })

        const devList = getGlobalState(context)
        const devInfo = devList?.find(item => {
          return item.devName === options[0].label
        })
        if (!devInfo) return

        // Progress 动效
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Window,
          title: 'EdgerOS',
          cancellable: false
        }, async (progress, token) => {
          progress.report({ message: 'Upload Test EdgerOS App' })
          await uploadEap(eapPath, devInfo.devIp, devInfo.devPwd)
          progress.report({ message: 'Install Test EdgerOS App' })
          const installMsg = await installEap(eapPath.split(path.sep).pop() as string, devInfo.devIp, devInfo.devPwd)
          return installMsg
        })
        vscode.window.showInformationMessage('Install test app success')
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message)
    }
  })
  context.subscriptions.push(disposable)
};
