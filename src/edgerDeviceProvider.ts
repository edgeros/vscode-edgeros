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
 
let channel: vscode.OutputChannel;
const tmpArr = [
  '<span class="mtk5">[0;37m[JSRE-CON][0;37mlog</span>正常输出 log中文内容111',
  '[0;37m[JSRE-CON][0;37mlog正常输出 log中文内容111',
  '[0;32m[JSRE-CON]Info:[0;37m正常输出 中文内容111',
  '[0;32m[JSRE-CON]Info:[0;37minfo normal title info yingwen test.111',
  '[0;33m[JSRE-CON]Warning:[0;37mwarn title msg warn context.111',
  '[0;31m[JSRE-CON]Error:[0;37merror title msg error context.111',
];
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
      throw new Error(cancel_add);
    }
    if(!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/img.test(ip_value)){
      vscode.window.showWarningMessage(format_error);
       this.addDevice(edger);
       return
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
      throw new Error(cancel_add);
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
    this.refresh();
  }

  updatePassword(edger: Edger, pass: string) {
    this._workspace.updateEdgerPassword(edger, pass);
    this.refresh();
  }

  async openConsole(edger: Edger) {
    if (!channel) {
      channel = vscode.window.createOutputChannel('Edger Console');
    }
    channel.show();
    // tmpArr.forEach((str1) => {
    //   str1 = replaceSpacielChar(str1);
    //   channel.appendLine(str1);
    // });

    const client = await getTcpClientInstance(
      { port: edger_console_port, host: edger.deviceIP } // edger.deviceIP
    );
    client.on('data', (data: Buffer) => {
      let str: string = data.toString('UTF-8', 0, data.length - 1);
      str = replaceSpacielChar(str);
      channel.append(str);
    });
    // client.on('close', (had_error) => {
    //   console.log('device connect close', had_error);
    // });
    // client.on('connect', () => {
    //   console.log('device connect connecting');
    // });
    // client.on('drain', () => {
    //   console.log('device connect drain');
    // });
    // client.on('end', () => {
    //   console.log('device connect end');
    // });
    // client.on('error', (res) => {
    //   console.log('device connect error', res);
    // });
  }
}

function getTcpClientInstance(
  opt: net.SocketConnectOpts,
  reconnection: number = 3
): Promise<net.Socket> {
  
  let tcpClient:any = null;
  // @ts-ignore
  let ref = global["tcpClient"];
  if(ref){
    tcpClient = ref as net.Socket;
  }
 
  // let reconnection: number = 3;

  const connectFn = (_tcpClient: net.Socket | null) => {
    if (_tcpClient) {
      return _tcpClient.connect(opt);
    }

    return net.createConnection(
      opt, // edger.deviceIP
      () => {
        // 'connect' listener.
        console.log(
          localize('connected_to_server.text', 'connected to server!')
        );
      }
    );
  };

  return new Promise((resolve) => {
    if (tcpClient) {
       // @ts-ignore
    global["tcpClient"] = tcpClient;
      resolve(tcpClient);
      return;
    }

    tcpClient = connectFn(tcpClient);
    // @ts-ignore
    global["tcpClient"] = tcpClient;

    // tcpClient.on('lookup', (res) => {
    //   console.log('device connect lookup', res);
    // });
    // tcpClient.on('close', (res) => {
    //   console.log('device connect lookup', res);
    // });

    tcpClient.on('timeout', () => {
      console.log('device connect timeout:');
      if (reconnection > 0) {
        reconnection--;
        tcpClient = connectFn(tcpClient);
      }
    });

    resolve(tcpClient);
  });
}

function replaceSpacielChar(str: string): string {
  str = str.replace(/\[0;37m/gim, '');
  str = str.replace(/\[0;37/gim, '');
  str = str.replace(/\[0;31m/gim, '');
  str = str.replace(/\[0;32m/gim, '');
  str = str.replace(/\[0;32/gim, '');
  str = str.replace(/\[0;33m/gim, '');
  str = str.replace(//gim, '');
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
