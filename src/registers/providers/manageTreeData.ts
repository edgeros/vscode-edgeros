/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 18:05:14 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-12 18:46:25
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
/**
 *Edgeros device  view Tree
 */
export = function (context: vscode.ExtensionContext) {
  if (vscode.workspace.workspaceFolders) {
    if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
      vscode.window.registerTreeDataProvider(
        'eosManageView',
        new EOSManageViewProvider(vscode.workspace.workspaceFolders[0].uri.fsPath)
      );
    }
  }
};


/**
 * Eos Manage View Provider
 */
class EOSManageViewProvider implements vscode.TreeDataProvider<EOSTreeItem> {
  constructor(private workspaceRoot: string) {
  }

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
          children = this.getDeviceList();
          break;
        case 'other':
          children = [];
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
  getDeviceList() {
    let devices = [];
    devices.push(new EOSTreeItem('mockDevice1', vscode.TreeItemCollapsibleState.None, 'device'));
    devices.push(new EOSTreeItem('mockDevice2', vscode.TreeItemCollapsibleState.None, 'device'));
    devices.push(new EOSTreeItem('mockDevice3', vscode.TreeItemCollapsibleState.None, 'device'));
    return devices;
  }

  /**
   * EOS pulgin show view root dir 
   * @returns 
   */
  private showTreeRootItem(): EOSTreeItem[] {
    let newProject = new EOSTreeItem('设备管理', vscode.TreeItemCollapsibleState.Expanded, 'deviceList');
    let devicesDir = new EOSTreeItem('其他功能', vscode.TreeItemCollapsibleState.Collapsed, 'other');
    return [newProject, devicesDir];
  }
}

/**
 * 
 *EOSTreeItem is View show item class
 *
 *type: deviceList / other / device
 * 
 */
class EOSTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public type: string
  ) {
    super(label, collapsibleState);
    this.setIconPath(type);
    this.setCommand(type);
  }
  setCommand(type: string) {
    if (type === 'device') {
      this.command = {
        command: "edgeros.helloWorld",
        title: "Hello WorldXXXX",
        arguments: [this.label]
      };
    }
  }
  setIconPath(type: string) {
    let iconPath: { dark: string, light: string };
    let iconBaseUrl = path.join(__dirname, '..', '..', '..', 'resources', 'icon');
    switch (type) {
      case "deviceList":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'deviceList.svg'), light: path.join(iconBaseUrl, 'light', 'deviceList.svg') };
        break;
      case "other":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'other.svg'), light: path.join(iconBaseUrl, 'light', 'other.svg') };
        break;
      case "device":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'device.svg'), light: path.join(iconBaseUrl, 'light', 'device.svg') };
        break;
      default:
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'other.svg'), light: path.join(iconBaseUrl, 'light', 'other.svg') };
    }
    this.iconPath = iconPath;
  }




}
