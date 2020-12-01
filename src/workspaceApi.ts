/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: workspaceApi.ts, vscode workspace related api.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */

import * as vscode from 'vscode';

import { Edger } from './edgerDeviceProvider';
import { edger_key, eap_desc_json_file_name } from './constants';

export class WorkspaceApi {
    _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    addEdger2Workspace(device_name: string, device_ip: string, device_pass?: string) {
        let edgers = this._context.globalState.get(edger_key) as Array<Edger>;
        const edger: Edger = new Edger(device_name, device_ip, device_pass);
        //save edger device info to worksapce
        if (!edgers) {
            edgers = new Array<Edger>();
        }
        edgers.push(edger);
        this._context.globalState.update(edger_key, edgers);
        console.log(`Edger device: ${device_name} - ${device_ip} saved.`);
    }

    deleteEdgerFromWorkspace(edger: Edger) {
        let edgers = this._context.globalState.get(edger_key) as Array<Edger>;
        if (edgers) {
            const index = edgers.indexOf(edger);
            if (index >= 0) {
                edgers.splice(index, 1);
                this._context.globalState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} removed.`);
            }
        }
    }

    updateEdgerPassword(edger: Edger, device_pass: string) {
        let edgers = this._context.globalState.get(edger_key) as Array<Edger>;
        if (edgers) {
            const index = edgers.indexOf(edger);
            if (index >= 0) {
                edgers[index].devicePass = device_pass;
                this._context.globalState.update(edger_key, edgers);
                console.log(`Edger device: ${edger.deviceName} - ${edger.deviceIP} password updated.`);
            }
        }
    }

    /**
     * Given workspace context, read all edger devices.
     */
    getEdgerDevices(): Edger[] {
        if (this._context.workspaceState) {
            const edgers = this._context.globalState.get(edger_key) as Array<Edger>;
            return edgers;
        } else {
            return [];
        }
    }

    async checkDescJson(projectRoot: string): Promise<void> {
        await vscode.workspace.openTextDocument(vscode.Uri.file(`${projectRoot}/${eap_desc_json_file_name}`))
            .then((document) => {
                // console.log(document.getText());
                let desc = JSON.parse(document.getText());
                let id = desc.id;
                if (!id) {
                    throw new Error('id is missing');
                }
                let name = desc.name;
                if (!name) {
                    throw new Error('name is missing');
                }
                let ico = desc.ico;
                if (!ico) {
                    throw new Error('ico is missing');
                }
                let program = desc.program;
                if (!program) {
                    throw new Error('program is missing');
                }
                let vendor = desc.vendor;
                if (!vendor) {
                    throw new Error('vendor is missing');
                }
            }, (err) => {
                throw new Error(err);
            });
    }
}