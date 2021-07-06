/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-16 17:12:57
 */
import * as vscode from 'vscode'
import { getGlobalState } from '../../common'
import { EOSTreeItem } from '../../lib/class/EOSTreeItem'
import * as tcpConsole from '../../lib/tcpConsole'
/**
 *command:  edgeros.openConsole
 */

let lastDevice: EOSTreeItem
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.openConsole', (...options: EOSTreeItem[]) => {
    const templastDevice = options[0] || lastDevice

    const devList = getGlobalState(context)
    const devData = devList?.find(item => {
      return item.devName === templastDevice.label
    })
    if (!devData) return

    // open console
    if (tcpConsole.openConsle(devData)) {
      lastDevice = templastDevice
    }
  })
  context.subscriptions.push(disposable)
};
