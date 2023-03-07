import * as vscode from 'vscode'
import manageTreeData = require('../providers/manageTreeData');
/**
 *command:  edgeros.closeConsole
 */
export = function (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('edgeros.closeWelcome', (...options: string[]) => {
    manageTreeData(context, true)
  })
  context.subscriptions.push(disposable)
};
