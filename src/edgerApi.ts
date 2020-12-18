/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: edgerApi.ts, Edger API client.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */

import { init, localize } from './utils/locale';
import FormData = require('form-data');
import * as vscode from 'vscode';
import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';

import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { edger_ide_port } from './constants';
import { WorkspaceApi } from './workspaceApi';
import { zipAsync } from './zipeap';
import { EventEmitter } from 'events';
import { EdgerProgress } from './progress';
import { showEdgerOSSettings } from './settingsUI';
import { doNewProject, showNewProjectPage } from './project';

export class EdgerApi extends EventEmitter {
  private _context: vscode.ExtensionContext;
  private _edgerDeviceProvider: EdgerDeivceProvider;
  private _workspace: WorkspaceApi;
  private _progress: EdgerProgress;

  constructor(context: vscode.ExtensionContext) {
    super();
    this._context = context;
    this._edgerDeviceProvider = new EdgerDeivceProvider(context);
    this._workspace = new WorkspaceApi(context);
    this._progress = new EdgerProgress(this);
  }

  // show new project page
  propmtNewProject() {
    showNewProjectPage(this._context);
  }

  async newProject(params: any) {
    const { state, projectDir } = await doNewProject(this._context, params);
    if (projectDir) {
      let uri = vscode.Uri.file(projectDir);
      let success = await vscode.commands.executeCommand(
        'vscode.openFolder',
        uri
      );
      if (!success) {
        vscode.window.showErrorMessage('New Project is error.');
      }
    }
  }

  async openSettings() {
    vscode.commands
      .executeCommand('workbench.action.openSettings', 'EdgerOS')
      .then((res) => {});
  }

  async openSettingsUI() {
    showEdgerOSSettings(this._context);
  }

  async install(edger: Edger): Promise<void> {
    const edger_ip: string = edger.deviceIP;
    if (!edger_ip || !vscode.workspace.workspaceFolders) {
      return;
    }

    var projectRootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    // check if app's desc.json is valid
    await this._workspace
      .checkDescJson(projectRootFolder)
      .then(undefined, (err) => {
        console.error(err);
        throw new Error(err);
      });

    // ask for device password
    let pass_options: vscode.InputBoxOptions = {
      value: edger ? edger.devicePass : '',
      prompt: localize('prompt_title.text', 'Edger Device Password.'),
      placeHolder: localize('device_password.text', '(device password)'),
    };
    const dev_pass = await vscode.window.showInputBox(pass_options);
    if (dev_pass === undefined) {
      console.log(
        localize('installation_cancelled.text', 'Installation cancelled.')
      );
      return;
    }
    // save device password
    this._edgerDeviceProvider.updatePassword(edger, dev_pass);

    // compress files as an EAP archive
    let eap_name = vscode.workspace.name + '.eap';
    const { dir, name } = path.parse(projectRootFolder);
    const eap_file_path = path.join(dir, eap_name);

    try {
      // console.log(`workspace path: ${dir}/${name}`);
      const zipRes = await zipAsync(dir, eap_file_path, [name], this._progress);
      if (!zipRes) {
        console.error(localize('zip_error.text', 'Making zip error.'));
        return;
      }
      console.log(localize('eap_succeeded.text', 'Making eap succeeded.'));
    } catch (error) {
      console.log(
        `${localize('eap_failed.text', 'Making eap failed')}: ${error}`
      );
      return;
    }

    // upload eap to edger device
    await this.uploadEap(eap_file_path, edger_ip, dev_pass)
      .then(() => {
        vscode.window.showInformationMessage(
          localize('upload_completed.text', 'Upload completed.')
        );
      })
      .catch((err) => {
        vscode.window.showErrorMessage(
          `${localize('upload_failed.text', 'Upload failed.')} - ${err.message}`
        );
      });
    // install/update eap on edger device
    await this.installEap(edger_ip, dev_pass, eap_name)
      .then(() => {
        vscode.window.showInformationMessage(
          localize('installation_completed.text', 'Installation completed.')
        );
      })
      .catch((err) => {
        vscode.window.showErrorMessage(
          `${localize('installation_failed.text', 'Installation failed.')} - ${
            err.message
          }`
        );
      });
  }

  archive(): Promise<string> {
    return new Promise(async (resolve) => {
      if (!vscode.workspace.workspaceFolders) {
        resolve('');
        throw new Error("Can't open workspace.");
      }
      var projectRootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      // check if app's desc.json is valid
      await this._workspace.checkDescJson(projectRootFolder);

      var eap_file_path = '';
      try {
        // compress files as an EAP archive
        let eap_name = vscode.workspace.name + '.eap';
        const { dir, name } = path.parse(projectRootFolder);
        const eap_file_path = path.join(dir, eap_name);

        try {
          // console.log(`workspace path: ${dir}/${name}`);
          const zipRes = await zipAsync(
            dir,
            eap_file_path,
            [name],
            this._progress
          );
          if (!zipRes) {
            console.error(localize('zip_error.text', 'Making zip error.'));
            resolve('');
            return;
          }
          console.log(localize('eap_succeeded.text', 'Making eap succeeded.'));
        } catch (error) {
          console.log(
            `${localize('eap_failed.text', 'Making eap failed')}: ${error}`
          );
          resolve('');
          return;
        }

        const openBtn:string = 'Reveal file in OS';

        vscode.window.showInformationMessage(
          `${localize(
            'eap_succeeded.text',
            `Making eap Succeeded`
          )}: ${eap_file_path}`,
          openBtn
        ).then((refBtn)=>{
          if(refBtn === openBtn){ 
            const _uri:vscode.Uri = vscode.Uri.parse(eap_file_path);
            vscode.commands.executeCommand("revealFileInOS", _uri); // explorer.openAndPassFocus
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(
          `${localize('eap_failed.text', 'Making eap failed')} - ${
            error.message
          }`
        );
        throw new Error(error);
      }
      resolve(eap_file_path);
    });
  }

  private async uploadEap(
    eap_path: string,
    edger_ip: string,
    dev_pass: string
  ) {
    const form = new FormData();
    form.append('eap', fs.createReadStream(eap_path));
    console.log(`device pass is: ${dev_pass}`);
    const uploadApiConfig = {
      baseURL: `http://${edger_ip}:${edger_ide_port}/`,
      auth: {
        username: 'edger',
        password: dev_pass,
      },
      headers: form.getHeaders(),
    };
    await axios
      .post('/upload', form, uploadApiConfig)
      .then(function (response) {
        console.log(
          `${localize(
            'upload_completed.text',
            'Upload completed.'
          )}: ${response}`
        );
      })
      .catch(function (err) {
        console.log(
          `${localize('upload_failed.text', 'Upload Failed.')}: ${err}`
        );
        throw new Error(err);
      });
  }

  private async installEap(
    edger_ip: string,
    dev_pass: string,
    eap_name: string
  ) {
    const installApiConfig = {
      baseURL: `http://${edger_ip}:${edger_ide_port}/`,
      auth: {
        username: 'edger',
        password: dev_pass,
      },
      headers: {
        common: {
          'Content-Type': 'application/json',
        },
      },
    };
    await axios
      .post(
        '/install',
        {
          eap: eap_name,
        },
        installApiConfig
      )
      .then(function (response) {
        console.log(
          `${localize(
            'installation_completed.text',
            'Installation completed.'
          )}: ${response}`
        );
      })
      .catch(function (err) {
        console.log(
          `${localize(
            'installation_failed.text',
            'Installation failed.'
          )}: ${err}`
        );
        throw new Error(err);
      });
  }
}
