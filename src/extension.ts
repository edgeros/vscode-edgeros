/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 14:58:39
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-03 20:43:13
 */

import * as vscode from 'vscode'
import registers from './registers'
import { upgradeReset } from './components/backstage'
import createLoginStatusBar from './components/loginBar'
// import nlsConfig from './lib/nls'

// The example uses the file message format.
// const localize = nlsConfig(__filename)

export function activate (context: vscode.ExtensionContext) {
  console.log('[EdgerOS Plugin] Start')
  // Handling after version upgrade
  upgradeReset(context)

  // registers all command
  for (const command in registers.commands) {
    registers.commands[command](context)
  }

  // registers all providers
  for (const provider in registers.providers) {
    registers.providers[provider](context)
  }

  // create user login status bar item
  createLoginStatusBar(context)
}

// this method is called when your extension is deactivated
export function deactivate () { }
