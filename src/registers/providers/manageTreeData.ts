/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 18:05:14 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-15 20:29:44
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as config from '../../lib/config';
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

  /**
   * refresh three view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
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
    public label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public type: string,
    public options?: any
  ) {
    super(label, collapsibleState);
    this.setIconPath(type);
    this.setCommand(type);
    this.contextValue = type;
  }
  setCommand(type: string) {
    if (type === 'device') {
      this.command = {
        command: "edgeros.showAddDevView",
        title: "Show Devices Info",
        arguments: [this.label]
      };
    } else if (type === 'web') {
      // set title 根据语言环境修改(未实现)
      this.label = this.options.title;
      this.options.showTitle = this.label;
      this.command = {
        command: "edgeros.showWebView",
        title: "Show Web View",
        arguments: [this.options]
      };
    }
  }
  setIconPath(type: string) {
    let iconPath: { dark: string, light: string };
    let iconBaseUrl = path.join(__dirname, '..', '..', '..', 'resources', 'icon');
    switch (type) {
      case "deviceList":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_deviceList.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_deviceList.svg') };
        break;
      case "device":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_device.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_device.svg') };
        break;
      case "other":
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_other.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_other.svg') };
        break;
      default:
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_other.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_other.svg') };
    }
    this.iconPath = iconPath;
  }




}
