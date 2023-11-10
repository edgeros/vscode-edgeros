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
import { EdgerosTreeItem } from '../../components/treeItem'
import { uploadEap, installEap } from '../../utility/edgerosApi'
import { getGlobalState, getWorkspaceSettings, selectBuildPath } from '../../common'
import nlsConfig from '../../nls'

const localize = nlsConfig(__filename)
const i18n = {
  testEntrypointLost: localize('testEntrypointLost.txt', 'Test entrypoint not defined in edgeros.json'),
  testFileLost: localize('testFileLost.txt.txt', 'Test entrypoint file not exist'),
  testInstallOk: localize('testInstallOk.txt', 'Install test app success')
}

/**
 *command:  edgeros.testEap
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.installTestEap', async (...options: EdgerosTreeItem[]) => {
    try {
      if (vscode.workspace.workspaceFolders) {
        const projectDir = await selectBuildPath(context)

        const eosJsonPath = path.join(projectDir, 'edgeros.json')
        delete require.cache[require.resolve(eosJsonPath)]
        const eosJson = require(eosJsonPath)

        if (!eosJson.test) {
          vscode.window.showErrorMessage(i18n.testEntrypointLost)
          return
        }

        if (!fs.existsSync(path.join(projectDir, eosJson.test))) {
          vscode.window.showErrorMessage(`${i18n.testFileLost} ${eosJson.test}`)
          return
        }

        // 构建测试eap
        const eapPath: string = await buildEap(projectDir, {
          configInfo: getWorkspaceSettings(),
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
        vscode.window.showInformationMessage(i18n.testInstallOk)
      }
    } catch (err:any) {
      vscode.window.showErrorMessage(err.message)
    }
  })
  context.subscriptions.push(disposable)
};
