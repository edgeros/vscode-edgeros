/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-16 17:12:57
 */
import * as vscode from 'vscode'
import { selectedDevice } from '../../common'
import { EdgerosTreeItem } from '../../components/treeItem'
import { connect } from '../../components/console'

export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.openConsole', async (...options: EdgerosTreeItem[]) => {
    connect(await selectedDevice(context, options))
  })
  context.subscriptions.push(disposable)
};
