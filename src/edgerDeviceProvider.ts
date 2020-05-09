import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContext } from 'vscode';

export const edger_key: string = 'edgers';

export class EdgerDeivceProvider implements vscode.TreeDataProvider<Edger> {
    _context: ExtensionContext;
    constructor(private context: ExtensionContext) {
        this._context = context;
    }

    getTreeItem(element: Edger): vscode.TreeItem {
        return new Edger(element.deviceName, element.deviceIP, element.collapsibleState);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<Edger | undefined> = new vscode.EventEmitter<Edger | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Edger | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildren(element?: Edger): Thenable<Edger[]> {
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

    addDevice() {
        let edger_ip = '';
        let options: vscode.InputBoxOptions = {
            prompt: "Edger Device IP Address.",
            placeHolder: "(device ip)"
        };

        vscode.window.showInputBox(options).then(value => {
            if (!value) {
                return;
            }

            edger_ip = value;
            console.log(`Edger device ip: ${edger_ip}`);

            let edger_name = '';
            let options: vscode.InputBoxOptions = {
                prompt: "Edger Device Name.",
                placeHolder: "(device name)"
            };
            vscode.window.showInputBox(options).then(value => {
                if (value) {
                    edger_name = value;
                }

                let edgers = this._context.workspaceState.get(edger_key);
                //save edger ip to worksapce
                if (!edgers) {
                    edgers = new Array<Edger>();
                }
                (edgers as Array<Edger>).push(new Edger(edger_name, edger_ip, vscode.TreeItemCollapsibleState.None));
                this._context.workspaceState.update(edger_key, edgers);
            });
        });
    }
}

export class Edger extends vscode.TreeItem {
    constructor(
        public readonly deviceName: string,
        public readonly deviceIP: string,
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