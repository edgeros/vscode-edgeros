/*
 * @Author: FuWenHao  
 * @Date: 2021-04-12 20:00:47 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-05-18 16:07:27
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as os from 'os';
import * as common from '../../lib/common';
import * as config from '../../lib/config';
import localMode from '../../generate/localMode';
import cloudMode from '../../generate/cloudMode';
import nlsConfig from '../../lib/nls';
const localize = nlsConfig(__filename);

/**
 *command:  edgeros.showCreateProView
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('edgeros.showCreateProView', async (...options: string[]) => {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel('createProject', 'Create Project', vscode.ViewColumn.One, {
        enableScripts: true
      });

      currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo);

      // set html/js path
      let webViewFileName = 'createProject';
      // get vue,element,css uri
      let assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context);
      // get css uri
      let cssUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'));
      // set html 
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris,
        cssUri,
        language: {
          "nameTxt": localize('name.txt', "Name"),
          "buildidTxt": localize('buildid.txt', "Bundleid"),
          "savePathTxt": localize('savePath.txt', "Save Path"),
          "descriptionTxt": localize('Description.txt', "Description"),
          "versionTxt": localize('version.txt', "Version"),
          "vendorIdTxt": localize('vendorId.txt', "Vendor Id"),
          "vendorNameTxt": localize('vendorName.txt', "Vendor Name"),
          "vendorEmailTxt": localize('vendorEmail.txt', "Vendor Email"),
          "vendorPhoneTxt": localize('vendorPhone.txt', "Vendor Phone"),
          "vendorFaxTxt": localize('vendorFax.txt', "Vendor Fax"),
          "createButtonTxt": localize('createButton.txt', "Create"),
          "otherText": localize('other.txt', "Other"),
          "openFileText": localize('openFile.txt', "Open the project in a new window"),
          "selectPathText": localize('selectPath.txt', "Select Path"),
          "nameNotEmptyText": localize('nameNotEmpty.txt', "Name Not Empty"),
          "projectTemplateWarehouseTxt": localize('projectTemplateWarehouse.txt', "Template Warehouse"),
          "projectTemplateHintTxt": localize('projectTemplateHint.txt', "Select the template and build it now"),
          "applyTxt": localize('apply.txt', "Apply"),
          "ApplyNowTxt": localize('applyNow.txt', "Apply Now")
        }
      });

      //reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {
        WebCmdHandle(currentPanel as vscode.WebviewPanel, message);
      });
      // webview close trigger
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }
  });
  context.subscriptions.push(disposable);
};


/**
 * webview send command message  handle
 */
async function WebCmdHandle(currentPanel: vscode.WebviewPanel, message: any) {
  try {
    // Send save path
    if (message.type === 'selectSavePath') {
      let selectSavePath = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: '请选择项目保存目录',
        openLabel: '选择'
      });
      if (selectSavePath) {
        currentPanel?.webview.postMessage({
          type: '_selectSavePath',
          data: selectSavePath[0].fsPath
        });
      }
    }
    // Send template list and template Types
    else if (message.type === 'getInfoData') {
      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: config.templates,
          templateTypes: config.templateTypes,
          defaultSavePath: path.join(os.homedir(), 'EdgerOSApps')
        }
      })
    }
    // Create project
    else if (message.type === 'createProject') {
      let tplInfo = message.data.tplData;
      let newProjectPath: string = '';
      if (tplInfo?.location == 'local') {
        newProjectPath = await localMode(tplInfo, message.data);
      } else if (tplInfo?.location == 'cloud') {
        newProjectPath = await cloudMode(tplInfo, message.data);
      }

      if (message.data.other.indexOf('openFile') != -1) {
        let newProUri = vscode.Uri.file(newProjectPath);
        await vscode.commands.executeCommand(
          'vscode.openFolder',
          newProUri, {
          forceNewWindow: true
        }
        );
      }

      //创建完成返回数据
      currentPanel?.webview.postMessage({
        type: '_createProject',
        data: 'success'
      });
      currentPanel.dispose();
    }
  } catch (err) {
    currentPanel.dispose();
    vscode.window.showInformationMessage(err.message);
  }
}


