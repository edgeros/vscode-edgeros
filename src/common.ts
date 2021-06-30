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
import { WorkspaceSettings } from './types'

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
