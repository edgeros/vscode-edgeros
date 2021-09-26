/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2021-09-26 15:21:18
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2021-09-26 15:28:24
 */
import * as vscode from 'vscode'
import { getEdgerOSProjectInfo, showSelectProjectList } from '../../common'
import { BuildInfo } from '../../types'
/**
 *command:  edgeros.pickBuildProject
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.setBuildProject', async (...options: string[]) => {
    try {
      const buildInfo: BuildInfo = await getEdgerOSProjectInfo(context)
      await showSelectProjectList(context, buildInfo)
    } catch (err) {
      vscode.window.showErrorMessage(`Build EdgerOS App failed: ${err.message}`)
    }
  })
  context.subscriptions.push(disposable)
};
