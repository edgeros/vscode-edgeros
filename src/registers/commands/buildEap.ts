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
import { getWorkspaceSettings } from '../../common'

export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.buildEap', startBuildEap)
  context.subscriptions.push(disposable)
};

function startBuildEap (...options: string[]) {
  const projectFolders = vscode.workspace.workspaceFolders
  if (!projectFolders || projectFolders.length < 1) {
    return vscode.window.showErrorMessage('Build EdgerOS App: no project in workspace')
  }

  const projectDir = projectFolders[0].uri.fsPath
  const settings = getWorkspaceSettings()

  buildEap(projectDir, { configInfo: settings })
    .then(bundleFile => {
      vscode.window.showInformationMessage('Build EdgerOS App success: ' + bundleFile)
    }, err => {
      vscode.window.showErrorMessage(`Build EdgerOS App failed: ${err.message}`)
    })
}
