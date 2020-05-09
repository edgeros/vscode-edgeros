import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionContext } from 'vscode';

export const edger_key: string = 'edgers';

export class EdgerDeivceProvider implements vscode.TreeDataProvider<Edger> {
    _context: ExtensionContext;
    constructor(context: ExtensionContext) {
        this._context = context;
    }

    getTreeItem(element: Edger): vscode.TreeItem {
        return new Edger(element.deviceName, element.deviceIP, '', element.collapsibleState);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Edger | undefined> = new vscode.EventEmitter<Edger | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Edger | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildren(_element?: Edger): Thenable<Edger[]> {
        if (this._context) {
            return Promise.resolve(this.getEdgerDevices(this._context));
        }
        else {
            return Promise.resolve([]);
        }
    }

    /**
     * Given workspace context, read all edger devices.
     */
    private getEdgerDevices(context: ExtensionContext): Edger[] {
        if (context.workspaceState) {
            const edgers = context.workspaceState.get(edger_key) as Array<Edger>;
            return edgers;
        } else {
            return [];
        }
    }

    async addDevice(edger?: Edger) {
        let device_ip = '';
        let ip_options: vscode.InputBoxOptions = {
            value: edger ? edger.deviceIP : '',
            prompt: "Edger Device IP Address.",
            placeHolder: "(device ip)"
        };
        const cancel_add = 'Cancelled adding device.';
        const ip_value = await vscode.window.showInputBox(ip_options);
        if (!ip_value) {
            throw new Error(cancel_add);
        }
        device_ip = ip_value;
        let device_name = '';
        let name_options: vscode.InputBoxOptions = {
            value: edger ? edger.deviceName : '',
            prompt: "Edger Device Name.",
            placeHolder: "(device name)"
        };

        const name_value = await vscode.window.showInputBox(name_options);
        if (!name_value) {
            throw new Error(cancel_add);
        }
        device_name = name_value;
        let edgers = this._context.workspaceState.get(edger_key);
        //save edger ip to worksapce
        if (!edgers) {
            edgers = new Array<Edger>();
        }
        (edgers as Array<Edger>).push(new Edger(device_name, device_ip, '', vscode.TreeItemCollapsibleState.None));
        this._context.workspaceState.update(edger_key, edgers);
        console.log(`Edger device: ${device_name} - ${device_ip} added.`);

        this.refresh();
        return true;
    }

    updateDevice(edger: Edger) {
        let state = this._context.workspaceState.get(edger_key);
        if (state) {
            let edgers = state as Array<Edger>;
            const index = edgers.indexOf(edger);
            this.addDevice(edger).then(() => {
                edgers.splice(index, 1);
                this._context.workspaceState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} removed.`);
                this.refresh();
            })
                .catch(error => console.info(error));
        }
    }

    deleteDevice(edger: Edger) {
        let state = this._context.workspaceState.get(edger_key);
        if (state) {
            let edgers = state as Array<Edger>;
            const index = edgers.indexOf(edger);
            if (index >= 0) {
                edgers.splice(index, 1);
                this._context.workspaceState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} removed.`);
                this.refresh();
            }
        }
    }
}

export class Edger extends vscode.TreeItem {
    constructor(
        public readonly deviceName: string,
        public deviceIP: string,
        public devicePass: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
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