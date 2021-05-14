/*
 * @Author: FuWenHao  
 * @Date: 2021-04-10 15:11:00 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-28 17:53:24
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
    try {
      if (vscode.workspace.workspaceFolders) {
        if (fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'edgeros.json'))) {
          try {
            // get egeros config
            let configInfo: any = {
              buildSuffix: vscode.workspace.getConfiguration('edgeros').get('buildType'),
              increment: vscode.workspace.getConfiguration('edgeros').get('versionIncrement'),
            }
            let eapPath: string = await buildEap(vscode.workspace.workspaceFolders[0].uri.fsPath, {
              configInfo: configInfo
            });
            let devList: any[] | undefined = context.globalState.get(devsStateKey);
            let devInfo = devList?.find(item => {
              return item.devName === options[0].label
            })

            let installType = vscode.workspace.getConfiguration('edgeros').get('installEAP')
            // 弹出选择框
            if (installType == 'Manual') {
              let fileNames = fs.readdirSync(vscode.workspace.workspaceFolders[0].uri.fsPath)
              let eapFile: string[] = [];
              fileNames.forEach(item => {
                if (item.lastIndexOf('.eap') != -1) {
                  eapFile.push(item);
                }
              })

              let eapName: string | undefined = await vscode.window.showQuickPick(eapFile)
              if (eapName) {
                eapPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, eapName);
              } else {
                throw new Error('No Choice EdgerOS APP Install Package!')
              }
            } else if (installType == 'Auto') {
              // 不做处理 
            }

            // Progress 动效
            let installMsg = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Window,
              title: "EdgerOS",
              cancellable: false
            }, async (progress, token) => {
              progress.report({ message: "Upload EdgerOS App" });
              let uploadMsg = await uploadEap(eapPath, devInfo.devIp, devInfo.devPwd);
              progress.report({ message: "Install EdgerOS App" });
              let installMsg = await installEap(eapPath.split(path.sep).pop() as string, devInfo.devIp, devInfo.devPwd);
              return installMsg
            })
            vscode.window.showInformationMessage('install app success');
          } catch (err) {
            vscode.window.showErrorMessage('Install EdgerOS App : ' + err);
          }
        } else {
          vscode.window.showErrorMessage('No edgeros project');
        }
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
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
}