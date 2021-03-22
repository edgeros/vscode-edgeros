/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: extension.ts, extension main file.
 *
 * Author: Li Qiang <liqiang@acoinfo.com>
 *
 */
import * as vscode from 'vscode';
import { from } from 'form-data';
import { init } from './utils/locale';
import { Edger, EdgerDeivceProvider } from './edgerDeviceProvider';
import { EdgerApi } from './edgerApi';
import { showPhone } from './mobile/mobile.browser';
import { MobileType } from './mobile/model';
import { EdgerOsCompletions } from './completions/edgerOs';

process.on('uncaughtException', function (err) {
  console.error(err);
});

export function activate(context: vscode.ExtensionContext) {
  init(context.extensionPath);
  const edgerDeivceProvider = new EdgerDeivceProvider(context);
  vscode.window.registerTreeDataProvider(
    'edgerDeviceView',
    edgerDeivceProvider
  );

  vscode.commands.registerCommand('edgerDevices.refreshDevice', () =>
    edgerDeivceProvider.refresh()
  );
  vscode.commands.registerCommand('edgerDevices.addDevice', () =>
    edgerDeivceProvider.addDevice()
  );
  vscode.commands.registerCommand('edgerDevices.updateDevice', (edger: Edger) =>
    edgerDeivceProvider.updateDevice(edger)
  );
  vscode.commands.registerCommand('edgerDevices.deleteDevice', (edger: Edger) =>
    edgerDeivceProvider.deleteDevice(edger)
  );
  vscode.commands.registerCommand('edgerDevices.openConsole', (edger: Edger) =>
    edgerDeivceProvider.openConsole(edger)
  );
  const edgerApi = new EdgerApi(context, edgerDeivceProvider);
  vscode.commands.registerCommand('edgerDevices.installApp', (edger: Edger) =>
    edgerApi.install(edger)
  );
  vscode.commands.registerCommand('edgerDevices.archive', () =>
    edgerApi.archive()
  );
  vscode.commands.registerCommand('edgeros.propmtNewProject', () =>
    edgerApi.propmtNewProject()
  );
  vscode.commands.registerCommand('edgeros.newProject', (params: any) =>
    edgerApi.newProject(params)
  );
  vscode.commands.registerCommand('edgeros.openSettings', (tplname: string, projectName: string) =>
    edgerApi.openSettings()
  );
  vscode.commands.registerCommand('edgeros.openSettingsUI', (tplname: string, projectName: string) =>
    edgerApi.openSettingsUI()
  );
  vscode.commands.registerCommand('edgeros.simulatorDownload', () =>
    edgerApi.simulatorDownload()
  );
  //
  const mobilePreview = vscode.commands.registerCommand(
    'mobile.preview',
    (deviceItem: IDeviceItem) => {
      let url = `https://${deviceItem.deviceIP}`;
      showPhone(context, MobileType.IPhoneX, url);
    }
  );
  context.subscriptions.push(mobilePreview);
  //
  //
  //
  const changeMobile = vscode.commands.registerCommand(
    'mobile.change',
    (url: string, mobileType: string) => {
      const _type: string = mobileType.toLowerCase();
      showPhone(context, _type as MobileType, url);
    }
  );
  context.subscriptions.push(changeMobile);


  EdgerOsCompletions(context);
}

interface IDeviceItem {
  contextValue: string;
  deviceIP: string;
  deviceName: string;
  devicePass: string;
  label: string;
  iconPath: {
    dark: string;
    light: string;
  };
}

export function deactivate() { }
