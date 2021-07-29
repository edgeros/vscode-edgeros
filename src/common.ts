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
import * as ejs from 'ejs'
import * as path from 'path'
import { promises as fs } from 'fs'

import { EdgerosDevice, WorkspaceSettings } from './types'
import {
  edgerosGlobalStateKeyTypo,
  edgerosGlobalStateKey
} from './config'

export const EXTENSION_NAME = 'edgeros'

export function getWorkspaceSettings () {
  const workspaceConfig = vscode.workspace.getConfiguration(EXTENSION_NAME)
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
  const deprecatedConns = globalState.get<EdgerosDevice[]>(edgerosGlobalStateKeyTypo)
  if (deprecatedConns) {
    // move the value under the new key name and delete the old typo key
    // https://github.com/Microsoft/vscode/issues/11528
    globalState.update(edgerosGlobalStateKey, deprecatedConns)
    globalState.update(edgerosGlobalStateKeyTypo, undefined)
    return deprecatedConns
  }
  return globalState.get<EdgerosDevice[]>(edgerosGlobalStateKey)
}

export function setGlobalState (context: vscode.ExtensionContext, value: any) {
  return context.globalState.update(edgerosGlobalStateKey, value)
}

/**
 * 将本地文件资源转换为webview需要的uri
 * @param panel
 * @param filePath
 * @returns
 */
export function changeUri (panel: vscode.WebviewPanel, filePath: string): vscode.Uri {
  const uri = vscode.Uri.file(filePath)
  return panel.webview.asWebviewUri(uri)
}
/**
 * 获取webview 基础资源
 * @param viewFileName
 * @param currentPanel
 * @param context
 * @returns
 */
export async function getWebViewBaseUris (viewFileName: string, currentPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  // 获取颜色主题 kind:1浅色主题 2深色主题 3高对比度
  // vscode.window.activeColorTheme;
  // base
  const basePath = path.join(context.extensionPath, 'view')
  const vueJsUri = changeUri(currentPanel, path.join(basePath, 'lib', 'vue.js'))
  const elementUiJsUri = changeUri(currentPanel, path.join(basePath, 'lib', 'element-ui.js'))
  const ttfUri = changeUri(currentPanel, path.join(basePath, 'lib', 'fonts', 'element-icons.ttf'))
  const woffUri = changeUri(currentPanel, path.join(basePath, 'lib', 'fonts', 'element-icons.woff'))
  // css file font uri update
  const cssStr = await ejs.renderFile(path.join(context.extensionPath, 'view', 'lib', 'element-ui.css'), {
    ttfUri,
    woffUri
  })
  const cssPath = path.join(context.extensionPath, 'view', viewFileName, 'z_element-ui.css')
  await fs.writeFile(cssPath, cssStr)
  const elementUiCssUri = changeUri(currentPanel, cssPath)
  // 获取webview入口文件
  const indexJsUri = changeUri(currentPanel, path.join(context.extensionPath, 'view', viewFileName, 'index.js'))
  return {
    vueJsUri,
    elementUiJsUri,
    elementUiCssUri,
    indexJsUri
  }
}
