/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-22 19:29:28
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from "fs-extra";
import buildEap from "../../generate/eapBuild";
import { EOSTreeItem } from '../../lib/class/EOSTreeItem';
import { devsStateKey, edgerosIdePort } from '../../lib/config';
import httpClient from '../../lib/httpClient';
import FormData = require('form-data');
import * as config from '../../lib/config';
/**
 *command:  edgeros.helloEdgerOS
 */
export = function (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('edgeros.installEap', async (...options: EOSTreeItem[]) => {
    // console.log("触发指令后参数", options);
    if (vscode.workspace.workspaceFolders) {
      if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
        try {
          // get egeros config
          let configInfo: any = context.globalState.get(config.edgerosCfgKey);
          let eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
            configInfo: configInfo
          });
          let devList: any[] | undefined = context.globalState.get(devsStateKey);
          let devInfo = devList?.find(item => {
            return item.devName === options[0].label
          })

          // Progress 动效
          let installMsg = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "EdgerOS",
            cancellable: false
          }, async (progress, token) => {
            progress.report({ message: "Upload EAP" });
            let uploadMsg = await uploadEap(eapPath, devInfo.devIp, devInfo.devPwd);
            progress.report({ message: "Install EAP" });
            let installMsg = await installEap(eapPath.split(path.sep).pop() as string, devInfo.devIp, devInfo.devPwd);
            return installMsg
          })

          vscode.window.showInformationMessage('install app success');
        } catch (err) {
          vscode.window.showErrorMessage('Install Eap Error:' + err);
        }
      } else {
        vscode.window.showErrorMessage('No edgeros project');
      }
    }
  });
  context.subscriptions.push(disposable);
};

/**
 * 上传eap文件至网关
 * @param eapPath 
 * @param devIp 
 * @param devPwd 
 */
async function uploadEap(eapPath: string, devIp: string, devPwd: string) {
  const form = new FormData();
  form.append('eap', fs.createReadStream(eapPath));
  console.log(`device pass is: ${devPwd}`);
  const uploadApiConfig = {
    baseURL: `http://${devIp}:${edgerosIdePort}/`,
    auth: {
      username: 'edger',
      password: devPwd,
    },
    headers: form.getHeaders(),
  };
  return httpClient
    .post('/upload', form, uploadApiConfig)
    .then(function (response) {
      return `Upload completed. ${eapPath}`;
    })
    // .catch(function (err) {
    //   vscode.window.showErrorMessage(
    //     `Upload failed. - Network connection timeout`
    //   );
    //   throw err;
    // });
}

async function installEap(eapName: string, devIp: string, devPwd: string) {
  const installApiConfig = {
    baseURL: `http://${devIp}:${edgerosIdePort}/`,
    auth: {
      username: 'edger',
      password: devPwd,
    },
    headers: {
      common: {
        'Content-Type': 'application/json',
      },
    },
  };
  return httpClient
    .post('/install', { eap: eapName }, installApiConfig)
    .then(function (response) {
      return `Installation completed.`;
    })
    // .catch(function (err) {
    //   vscode.window.showErrorMessage(`Installation failed. - Network connection timeout`);
    //   throw err;
    // });
}