/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : buildEap.ts
 * Desc   : vscode command to build EdgerOS app
 */
import * as vscode from 'vscode'
import buildEap from '../../generate/eapBuild'
import { getWorkspaceSettings, selectBuildPath } from '../../common'

export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.buildEap', startBuildEap.bind(undefined, context))
  context.subscriptions.push(disposable)
};

async function startBuildEap (context: vscode.ExtensionContext) {
  try {
    const projectFolders = vscode.workspace.workspaceFolders
    if (!projectFolders || projectFolders.length < 1) {
      return vscode.window.showErrorMessage('Build EdgerOS App: no project in workspace')
    }

    const projectDir = await selectBuildPath(context)
    const settings = getWorkspaceSettings()
    const bundleFile = await buildEap(projectDir, { configInfo: settings })
    vscode.window.showInformationMessage('Build EdgerOS App success: ' + bundleFile)
  } catch (err) {
    vscode.window.showErrorMessage(`Build EdgerOS App failed: ${err.message}`)
  }
}
