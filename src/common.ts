/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : common.ts
 * Desc   : sharable vscode API functions
 */
import * as vscode from 'vscode'
import { edgerosGlobalStateKeyTypo, edgerosGlobalStateKey } from './lib/config'
import { EdgerosDevice, WorkspaceSettings } from './types'

export const EXTENSION_ID = 'edgeros'

export function getWorkspaceSettings () {
  const workspaceConfig = vscode.workspace.getConfiguration(EXTENSION_ID)
  const settings: WorkspaceSettings = {
    buildSuffix: workspaceConfig.get('buildSuffix', 'zip'),
    versionIncrement: workspaceConfig.get('versionIncrement', true),
    installEAP: workspaceConfig.get('installEAP', 'Auto'),
    templateSource: workspaceConfig.get('templateSource', 'Github')
  }
  return settings
}

/**
 * A method to workround the old globalState storage key name typo
 */
export function getGlobalState (context: vscode.ExtensionContext) {
  const globalState = context.globalState
  const oldConns = globalState.get<EdgerosDevice[]>(edgerosGlobalStateKeyTypo)
  if (oldConns) {
    // move the value under the new key name and delete the old typo key
    // https://github.com/Microsoft/vscode/issues/11528
    globalState.update(edgerosGlobalStateKey, oldConns)
    globalState.update(edgerosGlobalStateKeyTypo, undefined)
    return oldConns
  }
  return globalState.get<EdgerosDevice[]>(edgerosGlobalStateKey)
}

export function setGlobalState (context: vscode.ExtensionContext, value: any) {
  return context.globalState.update(edgerosGlobalStateKey, value)
}
