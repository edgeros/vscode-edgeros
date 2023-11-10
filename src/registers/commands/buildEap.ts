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
import nlsConfig from '../../nls'

const localize = nlsConfig(__filename)
const i18n = {
  noProjectInWorkspace: localize('noProjectInWorkspace.txt', 'No EdgerOS project in workspace'),
  buildEapOk: localize('buildEapOk.txt', 'Build EdgerOS App success'),
  buildEapFailed: localize('buildEapFailed.txt', 'Build EdgerOS App failed')
}

export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.buildEap', startBuildEap.bind(undefined, context))
  context.subscriptions.push(disposable)
};

async function startBuildEap (context: vscode.ExtensionContext) {
  try {
    const projectFolders = vscode.workspace.workspaceFolders
    if (!(projectFolders && projectFolders.length > 0)) {
      return vscode.window.showErrorMessage(i18n.noProjectInWorkspace)
    }

    const projectDir = await selectBuildPath(context)
    const settings = getWorkspaceSettings()
    const bundleFile = await buildEap(projectDir, { configInfo: settings })
    vscode.window.showInformationMessage(`${i18n.buildEapOk} ${bundleFile}`)
  } catch (err:any) {
    vscode.window.showErrorMessage(`${i18n.buildEapFailed} ${err.message}`)
  }
}
