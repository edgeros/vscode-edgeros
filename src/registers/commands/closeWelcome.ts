/**
* Copyright (c) 2024 EdgerOS Team.
* All rights reserved.
*
* Detailed license information can be found in the LICENSE file.
*
* Author : RenTong <rentong@acoinfo.com>
* File   : closeWelcome.ts
* Desc   : closeWelcome command
*/

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
