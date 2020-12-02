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
import * as nls from 'vscode-nls';
const localize = nls.config({ messageFormat: nls.MessageFormat.file })();
import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext } from 'vscode';
import * as net from 'net';

import { WorkspaceApi } from './workspaceApi';
import { edger_console_port } from './constants';


export class EdgerDeivceProvider implements vscode.TreeDataProvider<Edger> {
    _context: ExtensionContext;
    _workspace: WorkspaceApi;
    constructor(context: ExtensionContext) {
        this._context = context;
        this._workspace = new WorkspaceApi(context);
    }

    getTreeItem(element: Edger): vscode.TreeItem {
        return new Edger(element.deviceName, element.deviceIP, '', element.collapsibleState);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Edger | undefined> = new vscode.EventEmitter<Edger | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Edger | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getChildren(_element?: Edger): Thenable<Edger[]> {
        if (this._context) {
            return Promise.resolve(this._workspace.getEdgerDevices());
        }
        else {
            return Promise.resolve([]);
        }
    }

    async addDevice(edger?: Edger) {
        const ipAddr = localize('device_ip_address.text', "Edger Device IP Address.");
        const deviceIp = localize('device_ip.text', "(device ip)");
        let device_ip = '';
        let ip_options: vscode.InputBoxOptions = {
            value: edger ? edger.deviceIP : '',
            prompt: ipAddr,
            placeHolder: deviceIp
        };
        const cancel_add = localize('cancelled_adding_device.text', 'Cancelled adding device.');
        const ip_value = await vscode.window.showInputBox(ip_options);
        if (!ip_value) {
            throw new Error(cancel_add);
        }
        device_ip = ip_value;
        let device_name = '';
        let name_options: vscode.InputBoxOptions = {
            value: edger ? edger.deviceName : '',
            prompt: localize('edger_device_name.text', "Edger Device Name."),
            placeHolder: localize('device_name.text', "(device name)")
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
        this.addDevice(edger).then(() => {
            this._workspace.deleteEdgerFromWorkspace(edger);
            this.refresh();
        })
            .catch(error => console.info(error));
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
        const channel = vscode.window.createOutputChannel('Edger Console');
        channel.show();

        const client = net.createConnection({ port: edger_console_port, host: edger.deviceIP }, () => {
            // 'connect' listener.
            console.log(localize('connected_to_server.text', 'connected to server!'));
        });
        client.on('data', (data: { toString: () => any; }) => {
            let str: string = data.toString().trim();
            console.log(str);
            channel.appendLine(str);
            // client.end();
        });
        client.on('end', () => {
            console.log(localize('disconnected_to_server.text', 'disconnected from server'));
        });
    }
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

    get tooltip(): string {
        return `${this.deviceName} - ${this.deviceIP}`;
    }

    get description(): string {
        return `${this.deviceIP}`;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'edger';
}