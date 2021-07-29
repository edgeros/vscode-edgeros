/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 15:11:00
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-16 17:13:03
 */
import * as vscode from 'vscode'
import { disconnect } from '../../components/console'
/**
 *command:  edgeros.closeConsole
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.closeConsole', (...options: string[]) => {
    disconnect()
  })
  context.subscriptions.push(disposable)
};
