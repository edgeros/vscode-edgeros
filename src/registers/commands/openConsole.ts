/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-16 17:12:57
 */
import * as vscode from 'vscode'
import { EOSTreeItem } from '../../lib/class/EOSTreeItem'
import * as config from '../../lib/config'
import * as tcpConsole from '../../lib/tcpConsole'
/**
 *command:  edgeros.openConsole
 */

let lastDevice: EOSTreeItem
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.openConsole', (...options: EOSTreeItem[]) => {
    const templastDevice = options[0] || lastDevice

    const devList: Array<any> = context.globalState.get(config.devsStateKey) || []
    const devData = devList.find(item => {
      return item.devName === templastDevice.label
    })

    // open console
    if (tcpConsole.openConsle(devData)) {
      lastDevice = templastDevice
    }
  })
  context.subscriptions.push(disposable)
};
