/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2021-11-25 17:49:27
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2021-11-25 18:52:23
 */

/**
 * vscode 版本升级后应用重置
 */
import * as vscode from 'vscode'
import * as config from '../config'
const packageJson = require('../../package.json')

/**
 * 版本更新后需要完成的动作
 */
export function upgradeReset(context: vscode.ExtensionContext) {
  // 版本改变后主动清空模板缓存
  const oldVersion: string | undefined = context.globalState.get(config.edgerosVersionKey)
  if (packageJson.version !== oldVersion) {
    context.globalState.update(config.edgerosGlobalStateKeyTemplates, undefined)
    context.globalState.update(config.edgerosVersionKey, packageJson.version)
  }
}
