/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : statusBar.ts
 * Desc   : console connection status button component
 */

import * as vscode from 'vscode'
import { EdgerosDevice } from '../types'

export class ConsoleStatusButton {
  private statusBarItem: vscode.StatusBarItem | undefined
  private device: EdgerosDevice

  constructor (device: EdgerosDevice) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    this.device = device
  }

  dispose () {
    this.statusBarItem?.dispose()
    this.statusBarItem = undefined
  }

  connecting (device: EdgerosDevice, reconnectHint = '') {
    const statusButton = this.statusBarItem!
    statusButton.command = 'edgeros.closeConsole'
    if (reconnectHint) {
      statusButton.text = `$(sync~spin)  [ ${device.devName} : ${device.devIp} ] retry ${reconnectHint} `
    } else {
      statusButton.text = `$(sync~spin)  [ ${device.devName} : ${device.devIp} ] `
    }
    statusButton.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
    statusButton.tooltip = `Connecting ${device.devIp}` // TODO: NLS
    statusButton.show()
  }

  connected (device: EdgerosDevice) {
    this.device = device
    const statusButton = this.statusBarItem!
    statusButton.command = 'edgeros.closeConsole'
    statusButton.text = `$(link)  [ ${device.devName} : ${device.devIp} ]`
    statusButton.tooltip = 'Click to disconnect' // TODO: NLS
    statusButton.backgroundColor = new vscode.ThemeColor('statusBarItem.debuggingBackground')
    statusButton.show()
  }

  disconnected () {
    const device = this.device!
    const statusButton = this.statusBarItem!
    statusButton.command = 'edgeros.openConsole'
    statusButton.text = `$(debug-disconnect)  [ ${device.devName} : ${device.devIp} ] `
    statusButton.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
    statusButton.tooltip = 'Click to reconnect' // TODO: NLS
    statusButton.show()
  }
}
