/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 18:05:14 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-06-07 14:37:28
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as config from '../../lib/config';
import { EOSTreeItem } from '../../lib/class/EOSTreeItem';
import nlsConfig from '../../lib/nls';
const localize = nlsConfig(__filename);

/**
 *Edgeros device  view Tree
 */
export = function (context: vscode.ExtensionContext) {
  if (vscode.workspace.workspaceFolders) {
    if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
      let threeViewProvider = new EOSManageViewProvider(vscode.workspace.workspaceFolders[0].uri.fsPath, context);
      vscode.window.registerTreeDataProvider(
        'eosManageView',
        threeViewProvider
      );

      //register Command
      vscode.commands.registerCommand('edgeros.refreshThreeView', () =>
        threeViewProvider.refresh()
      );
    }
  }
};


/**
 * Eos Manage View Provider
 */
class EOSManageViewProvider implements vscode.TreeDataProvider<EOSTreeItem> {
  constructor(private workspaceRoot: string, private context: vscode.ExtensionContext) {

  }
  private _onDidChangeTreeData: vscode.EventEmitter<EOSTreeItem | undefined | null | void> = new vscode.EventEmitter<EOSTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EOSTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: EOSTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EOSTreeItem): Thenable<EOSTreeItem[]> {

    if (!element) {
      return Promise.resolve(this.showTreeRootItem());
    } else {
      let children: EOSTreeItem[];
      switch (element.type) {
        case 'deviceList':
          children = this.getDeviceList(this.context);
          break;
        case 'other':
          children = this.getOtherList(this.context);
          break;
        default:
          return Promise.resolve([]);
      }

      return Promise.resolve(children);
    }
  }

  /**
   * get local save device 
   * @returns 
   */
  getDeviceList(context: vscode.ExtensionContext) {
    let devices: EOSTreeItem[] = [];
    let devList: any[] = context.globalState.get(config.devsStateKey) || [];
    devList = devList.filter((item) => {
      return !!item.devId
    });
    devList.forEach((item: any) => {
      devices.push(new EOSTreeItem(item.devName, vscode.TreeItemCollapsibleState.None, 'device'));
    });
    return devices;
  }

  /**
   * get other
   * @returns 
   */
  getOtherList(context: vscode.ExtensionContext) {
    let devices: EOSTreeItem[] = [];
    // add web item
    config.edgerOsWebData.forEach((webItem: any) => {
      devices.push(new EOSTreeItem(webItem.url, vscode.TreeItemCollapsibleState.None, 'web', webItem));
    });

    devices.push(new EOSTreeItem(localize('buildEAP.txt', 'Build EdgerOS App'), vscode.TreeItemCollapsibleState.None, 'buildEap'));
    return devices;
  }

  /**
   * EOS pulgin show view root dir 
   * @returns 
   */
  private showTreeRootItem(): EOSTreeItem[] {
    let newProject = new EOSTreeItem(localize('deviceList.txt', 'Devices'), vscode.TreeItemCollapsibleState.Expanded, 'deviceList');
    let devicesDir = new EOSTreeItem(localize('other.txt', 'Other'), vscode.TreeItemCollapsibleState.Collapsed, 'other');
    return [newProject, devicesDir];
  }

  /**
   * refresh three view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
