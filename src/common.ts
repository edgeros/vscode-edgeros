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
import * as fs from 'fs-extra'

import { EdgerosDevice, WorkspaceSettings, BuildInfo } from './types'
import {
  edgerosGlobalStateKeyTypo,
  edgerosGlobalStateKey,
  edgerosBuildInfoKey
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
  await fs.promises.writeFile(cssPath, cssStr)
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

/**
 * 检查工作空间内 1至2级文件夹 EdgerOS 项目并并存储
 * @param context
 * @returns Promise<BuildInfo> 返回 EdgerOS 项目结构
 */
export async function getEdgerOSProjectInfo (context: vscode.ExtensionContext): Promise<BuildInfo> {
  const edgerOSPath: string[] = []
  if (vscode.workspace.workspaceFolders) {
    const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath
    const fileNames = fs.readdirSync(workspacePath)
    // 一级路径检查
    if (fs.existsSync(path.join(workspacePath, 'edgeros.json'))) {
      edgerOSPath.push(workspacePath)
    }
    // 二级路径检查
    for (const dirName of fileNames) {
      const dirPath = path.join(workspacePath, dirName)
      const dirStat = fs.statSync(dirPath)
      if (dirStat.isDirectory()) {
        if (fs.existsSync(path.join(dirPath, 'edgeros.json'))) {
          edgerOSPath.push(dirPath)
        }
      }
    }
  }
  // 更新当前工作空间项目信息
  const buildInfoJson: string | undefined = context.workspaceState.get(edgerosBuildInfoKey)
  let buildInfoObj: BuildInfo = {
    selectBuild: null,
    projectPaths: edgerOSPath
  }

  if (buildInfoJson) {
    buildInfoObj = JSON.parse(buildInfoJson)
    buildInfoObj.projectPaths = edgerOSPath
  }

  await context.workspaceState.update(edgerosBuildInfoKey, JSON.stringify(buildInfoObj))
  return buildInfoObj
}

/**
 * 选择编译项目路径
 * @param context
 * @returns string 返回需要编译的项目路径
 */
export async function selectBuildPath (context: vscode.ExtensionContext): Promise<string> {
  const buildInfo: BuildInfo = await getEdgerOSProjectInfo(context)
  if (buildInfo.projectPaths.length > 0) {
    if (buildInfo.selectBuild) {
      const exist = buildInfo.projectPaths.find((item: string) => {
        return item === buildInfo.selectBuild
      })
      if (exist) {
        return buildInfo.selectBuild
      } else {
        return await showSelectProjectList(context, buildInfo)
      }
    } else {
      return await showSelectProjectList(context, buildInfo)
    }
  } else {
    throw new Error('No buildable projects were found')
  }
}

/**
 * 弹出用户确认选择编译项目的弹出框
 * @param context
 * @param buildInfo
 * @returns string 返回所选择的构建路径
 */
export async function showSelectProjectList (context: vscode.ExtensionContext, buildInfo: BuildInfo): Promise<string> {
  if (buildInfo.projectPaths.length === 1) {
    buildInfo.selectBuild = buildInfo.projectPaths[0]
  } else {
    const pickStrList: string[] = []
    const pickObjList: { projectPath: string, pickValue: string }[] = []
    for (const projectPath of buildInfo.projectPaths) {
      const edgerosStr = path.join(projectPath, 'edgeros.json')
      const edgerosInfo: any = JSON.parse(fs.readFileSync(edgerosStr, { encoding: 'utf-8' }))
      let pickValue: string = `${edgerosInfo.name} - ${edgerosInfo.bundleid} - ${projectPath}`
      if (projectPath === buildInfo.selectBuild) {
        pickValue = '* ' + pickValue
      } else {
        pickValue = '- ' + pickValue
      }
      pickStrList.push(pickValue)
      pickObjList.push({
        projectPath: projectPath,
        pickValue: pickValue
      })
    }
    const pickValue = await vscode.window.showQuickPick(pickStrList)
    if (pickValue) {
      const pickObj = pickObjList.find(item => {
        return pickValue === item.pickValue
      })
      buildInfo.selectBuild = pickObj?.projectPath as string
    } else {
      if (!buildInfo.selectBuild) {
        throw new Error('Please select the project you want to build')
      }
    }
  }

  await context.workspaceState.update(edgerosBuildInfoKey, JSON.stringify(buildInfo))
  return buildInfo.selectBuild
}
