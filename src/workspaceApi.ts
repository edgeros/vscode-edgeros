import * as vscode from 'vscode';

import { Edger } from './edgerDeviceProvider';
import { edger_key } from './contants';

export class WorkspaceApi {
    _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    addEdger2Workspace(device_name: string, device_ip: string, device_pass?: string) {
        let edgers = this._context.workspaceState.get(edger_key) as Array<Edger>;
        const edger: Edger = new Edger(device_name, device_ip, device_pass);
        //save edger device info to worksapce
        if (!edgers) {
            edgers = new Array<Edger>();
        }
        edgers.push(edger);
        this._context.workspaceState.update(edger_key, edgers);
        console.log(`Edger device: ${device_name} - ${device_ip} saved.`);
    }

    deleteEdgerFromWorkspace(edger: Edger) {
        let edgers = this._context.workspaceState.get(edger_key) as Array<Edger>;
        if (edgers) {
            const index = edgers.indexOf(edger);
            if (index >= 0) {
                edgers.splice(index, 1);
                this._context.workspaceState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} removed.`);
            }
        }
    }

    saveEdgerPassword(edger: Edger, device_pass: string) {
        let edgers = this._context.workspaceState.get(edger_key) as Array<Edger>;
        if (edgers) {
            const index = edgers.indexOf(edger);
            if (index >= 0) {
                edgers.splice(index, 1);
                edger.devicePass = device_pass;
                edgers.push(edger);
                this._context.workspaceState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} password saved.`);
            }
        }
    }

    /**
     * Given workspace context, read all edger devices.
     */
    getEdgerDevices(): Edger[] {
        if (this._context.workspaceState) {
            const edgers = this._context.workspaceState.get(edger_key) as Array<Edger>;
            return edgers;
        } else {
            return [];
        }
    }
}