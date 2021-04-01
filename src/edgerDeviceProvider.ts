/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: edgerDeviceProvider.ts, Edger device data provider.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */

import { localize } from './utils/locale';
import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext } from 'vscode';
import * as net from 'net';

import { WorkspaceApi } from './workspaceApi';
import { edger_console_port } from './constants';

var channel: vscode.OutputChannel;
var connectStatusBar: vscode.StatusBarItem;

var tcpObjects: any = {};
var initiativeClose: Boolean = false;

export class EdgerDeivceProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  _context: ExtensionContext;
  _workspace: WorkspaceApi;

  constructor(context: ExtensionContext) {
    this._context = context;
    this._workspace = new WorkspaceApi(context);
  }

  getTreeItem(element: Edger | EdgerMenuItem): vscode.TreeItem {
    // @ts-ignore
    const { deviceName = '', deviceIP = '', name, command } = element;
    if (deviceName && deviceIP) {
      return new Edger(deviceName, deviceIP, '', element.collapsibleState);
    } else {
      return new EdgerMenuItem(name, command);
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    Edger | undefined
  > = new vscode.EventEmitter<Edger | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Edger | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getChildren(_element?: Edger): Thenable<vscode.TreeItem[]> {
    if (this._context) {
      const dataItems = this._workspace.getEdgerDevices();
      const newProjectBtn = new EdgerMenuItem('new', {
        title: 'new Project.',
        command: 'edgeros.propmtNewProject',
      });
      const newProjectBtn2 = new EdgerMenuItem('simulator', {
        title: 'Simulator Download.',
        command: 'edgeros.simulatorDownload',
      });
      let staticDataItems: vscode.TreeItem[] = [];
      if (dataItems && dataItems.length) {
        staticDataItems = dataItems.filter((item) => {
          return item.command?.command !== 'edgeros.propmtNewProject';
        });
      }

      staticDataItems.push(newProjectBtn);
      staticDataItems.push(newProjectBtn2);
      return Promise.resolve(staticDataItems);
    } else {
      return Promise.resolve([]);
    }
  }

  async addDevice(edger?: Edger) {
    const ipAddr = localize(
      'device_ip_address.text',
      'Edger Device IP Address.'
    );
    const deviceIp = localize('device_ip.text', '(device ip)');
    let device_ip = '';
    let ip_options: vscode.InputBoxOptions = {
      value: edger ? edger.deviceIP : '',
      prompt: ipAddr,
      placeHolder: deviceIp,
    };
    const cancel_add = localize(
      'cancelled_adding_device.text',
      'Cancelled adding device.'
    );
    const format_error = localize(
      'format_error_adding_device.text',
      'device IP format ERROR.'
    );
    const ip_value = await vscode.window.showInputBox(ip_options);
    if (!ip_value) {
      vscode.window.showWarningMessage(cancel_add);
      return;
    }
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/img.test(ip_value)) {
      vscode.window.showWarningMessage(format_error);
      this.addDevice(edger);
      return;
    }
    device_ip = ip_value;
    let device_name = '';
    let name_options: vscode.InputBoxOptions = {
      value: edger ? edger.deviceName : '',
      prompt: localize('edger_device_name.text', 'Edger Device Name.'),
      placeHolder: localize('device_name.text', '(device name)'),
    };

    const name_value = await vscode.window.showInputBox(name_options);
    if (!name_value) {
      vscode.window.showWarningMessage(cancel_add);
      return;
    }
    device_name = name_value;
    this._workspace.addEdger2Workspace(device_name, device_ip);

    this.refresh();
    return true;
  }

  updateDevice(edger: Edger) {
    this.addDevice(edger)
      .then(() => {
        this._workspace.deleteEdgerFromWorkspace(edger);
        this.refresh();
      })
      .catch((error) => console.info(error));
  }

  deleteDevice(edger: Edger) {
    this._workspace.deleteEdgerFromWorkspace(edger);
    if (tcpObjects[edger.deviceName]) {
      initiativeClose = true;
      tcpObjects[edger.deviceName].destroy();
    }
    this.refresh();
  }

  updatePassword(edger: Edger, pass: string) {
    this._workspace.updateEdgerPassword(edger, pass);
    this.refresh();
  }

  async openConsole(edger: Edger) {
    if (!channel) {
      connectStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      channel = vscode.window.createOutputChannel('Edger Console');
    }

    if (Object.keys(tcpObjects).length === 0) {
      initiativeClose = false;
      getTcpClientInstance(edger, 1, channel, connectStatusBar);
    } else {
      vscode.window.showErrorMessage(localize('TCP_Channal_Occupy.text') + `${Object.keys(tcpObjects)[0]}`);
      console.log(`TCP the connection already exists deviceName[${edger.deviceName}]`);
    }
  }

  async closeTCP() {
    initiativeClose = true;
    for (let key in tcpObjects) {
      tcpObjects[key].destroy();
    }
  }
}

function getTcpClientInstance(
  edger: Edger,
  reconnection: number = 1,
  channel: vscode.OutputChannel,
  connectStatusBar: vscode.StatusBarItem
) {

  let tcp_client = net.createConnection({
    port: edger_console_port,
    host: edger.deviceIP,
    timeout: 3000
  }, () => {
    channel.show();
    reconnection = 1;
    tcpObjects[edger.deviceName] = tcp_client;
    console.log(localize('connected_to_server.text', 'connected to server!') + `:${edger.deviceIP} [TCP]`);
    connectStatusBar.text = `$(link)  [ ${edger.deviceName} : ${edger.deviceIP} ]`;
    connectStatusBar.tooltip = localize('click_disconnect.text');
    connectStatusBar.command = 'edgerDevices.closeTCP';
    connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.debuggingBackground');
    connectStatusBar.show();
  });

  // 接收数据
  tcp_client.on('data', function (data) {
    let str: string = data.toString('UTF-8', 0, data.length - 1);
    str = replaceSpacielChar(str);
    channel.append(str);
  });

  // tcp_client.on('end', function () {
  //   console.log(`TCP ${edger.deviceName}:${edger.deviceIP} end disconnect [End]`);
  //   delete tcpObjects[edger.deviceName];
  //   tcp_client.end();
  // });

  tcp_client.on('close', function () {
    console.log(`TCP ${edger.deviceName}:${edger.deviceIP} end disconnect [Close]`);
    if (reconnection > 3 || initiativeClose) {
      console.log(`TCP the maximum number of connections is exceeded`);
      connectStatusBar.text = `$(debug-disconnect)  [ ${edger.deviceName} : ${edger.deviceIP} ] `;
      connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      connectStatusBar.tooltip = localize('click_reconnect.text');
      connectStatusBar.command = "edgerDevices.openConsole";
      connectStatusBar.show();
      delete tcpObjects[edger.deviceName];
    } else {
      console.log(`TCP Connect Relinking  2s[TimeOut] count:>${reconnection}`);
      connectStatusBar.text = `$(sync~spin) try connect ( ${reconnection} ) [ ${edger.deviceName} ]`;
      connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      connectStatusBar.tooltip = localize("click_connecting.text");
      connectStatusBar.command = undefined;
      connectStatusBar.show();

      reconnection++;
      setTimeout(() => {
        getTcpClientInstance(edger, reconnection, channel, connectStatusBar);
      }, 3000);
    }
  });

  // tcp_client.on('error', function (err) {
  //   connectStatusBar.text = `$(debug-disconnect)  [ ${edger.deviceName} ] -> ${edger.deviceIP}`;
  //   connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  //   connectStatusBar.show();

  //   console.log(`TCP ${edger.deviceName}:${edger.deviceIP} end disconnect [Error]:`, err);
  //   delete tcpObjects[edger.deviceName];
  //   tcp_client.end();
  // });

  // tcp_client.on('timeout', function () {
  //   if (reconnection > 3) {
  //     console.log(`TCP the maximum number of connections is exceeded`);
  //   } else {
  //     console.log(`TCP Connect Relinking  2s[TimeOut] count:>${reconnection}`);
  //     reconnection++;
  //     setTimeout(() => {
  //       getTcpClientInstance(edger, reconnection, channel, connectStatusBar);
  //     }, 3000);
  //   }
  // });
}



function replaceSpacielChar(str: string): string {
  str = str.replace(/\x1b\[(\d+|\d+;\d+)m{1}/gim, '');
  return str;
}

export class Edger extends vscode.TreeItem {
  constructor(
    public readonly deviceName: string,
    public deviceIP: string,
    public devicePass?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(deviceName, collapsibleState);
  }

  tooltip = `${this.deviceName} - ${this.deviceIP}`;
  description = `${this.deviceIP}`;

  iconPath = {
    light: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'light',
      'router.svg'
    ),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'router.svg'),
  };

  contextValue = 'edger';
}

export class EdgerMenuItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly command?: vscode.Command
  ) {
    super(name);
  }

  label = localize(`extension.commands.${this.name}`, this.name) as string;
  tooltip = localize(`extension.commands.${this.name}`, this.name) as string;
  description = localize(
    `extension.commands.${this.name}`,
    this.name
  ) as string;

  iconPath = {
    light: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'light',
      this.name + '.svg'
    ),
    dark: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'dark',
      this.name + '.svg'
    ),
  };
}
