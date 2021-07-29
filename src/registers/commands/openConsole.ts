/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-16 17:12:57
 */
import * as vscode from 'vscode'
import { getGlobalState } from '../../common'
import { EdgerosTreeItem } from '../../components/treeItem'
import { connect } from '../../components/console'

export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.openConsole', (...options: EdgerosTreeItem[]) => {
    if (options && options.length > 0) {
      const templastDevice = options[0]
      const deviceList = getGlobalState(context)
      const devData = deviceList?.find(item => {
        return item.devName === templastDevice.label
      })
      connect(devData)
    } else {
      connect()
    }
  })
  context.subscriptions.push(disposable)
};
