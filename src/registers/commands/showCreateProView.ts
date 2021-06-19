/*
 * @Author: FuWenHao
 * @Date: 2021-04-12 20:00:47
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-10 14:24:22
 */
import * as vscode from 'vscode'
import * as ejs from 'ejs'
import * as path from 'path'
import * as os from 'os'
import * as common from '../../lib/common'
import * as config from '../../lib/config'
import localMode from '../../generate/localMode'
import cloudMode from '../../generate/cloudMode'
import nlsConfig from '../../lib/nls'
const localize = nlsConfig(__filename)

/**
 *command:  edgeros.showCreateProView
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined

  const disposable = vscode.commands.registerCommand('edgeros.showCreateProView', async (...options: string[]) => {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
    if (currentPanel) {
      currentPanel.reveal(columnToShowIn)
    } else {
      currentPanel = vscode.window.createWebviewPanel('createProject', 'Create Project', vscode.ViewColumn.One, {
        enableScripts: true
      })

      currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo)

      // set html/js path
      const webViewFileName = 'createProject'
      // get vue,element,css uri
      const assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context)
      // get css uri
      const cssUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'))
      // set html
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris,
        cssUri,
        language: {
          nameTxt: localize('name.txt', 'Name'),
          buildidTxt: localize('buildid.txt', 'Bundleid'),
          savePathTxt: localize('savePath.txt', 'Save Path'),
          descriptionTxt: localize('Description.txt', 'Description'),
          versionTxt: localize('version.txt', 'Version'),
          vendorIdTxt: localize('vendorId.txt', 'Vendor Id'),
          vendorNameTxt: localize('vendorName.txt', 'Vendor Name'),
          vendorEmailTxt: localize('vendorEmail.txt', 'Vendor Email'),
          vendorPhoneTxt: localize('vendorPhone.txt', 'Vendor Phone'),
          vendorFaxTxt: localize('vendorFax.txt', 'Vendor Fax'),
          createButtonTxt: localize('createButton.txt', 'Create'),
          otherText: localize('other.txt', 'Other'),
          openFileText: localize('openFile.txt', 'Open the project in a new window'),
          selectPathText: localize('selectPath.txt', 'Select Path'),
          nameNotEmptyText: localize('nameNotEmpty.txt', 'Name Not Empty'),
          projectTemplateWarehouseTxt: localize('projectTemplateWarehouse.txt', 'Template Warehouse'),
          projectTemplateHintTxt: localize('projectTemplateHint.txt', 'Select the template and build it now'),
          applyTxt: localize('apply.txt', 'Apply'),
          applyNowTxt: localize('applyNow.txt', 'Apply Now'),
          bundleIdNotEmptyText: localize('bundleIdNotEmptyText.txt', 'bundleid is required'),
          bundleIdIncorrectFormatText: localize('bundleIdIncorrectFormatText.txt', 'It needs to be formatted: [a-z]([a-z0-9-]*)(\\.([a-z0-9-]+)){2,}'),
          versionIdNotEmptyText: localize('versionIdNotEmptyText.txt', 'Vendor id is required'),
          versionIdIncorrectFormatText: localize('versionIdIncorrectFormatText.txt', 'Should be a number'),
          vendorNameNotEmptyText: localize('vendorNameNotEmptyText.txt', 'Vendor name is required'),
          refreshTemplateingText: localize('refreshTemplateingText.txt', 'Getting a template'),
          refreshTemplateText: localize('refreshTemplateText.txt', 'Refresh the templates'),
          cloudText: localize('cloudText.txt', 'cloud')
        }
      })

      // reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {
        webCmdHandle(currentPanel as vscode.WebviewPanel, message)
      })
      // webview close trigger
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined
        },
        null,
        context.subscriptions
      )
    }
  })
  context.subscriptions.push(disposable)
};

/**
 * webview send command message  handle
 */
async function webCmdHandle (currentPanel: vscode.WebviewPanel, message: any) {
  try {
    // Send save path
    if (message.type === 'selectSavePath') {
      const selectSavePath = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: '请选择项目保存目录',
        openLabel: '选择'
      })
      if (selectSavePath) {
        currentPanel?.webview.postMessage({
          type: '_selectSavePath',
          data: selectSavePath[0].fsPath
        })
      }
    } else if (message.type === 'getInfoData') { // Send template list and template Types
      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: await config.getTemplatesList('local'),
          templateTypes: config.templateTypes,
          defaultSavePath: path.join(os.homedir(), 'EdgerOSApps'),
          incloud: false
        }
      })

      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: await config.getTemplatesList('all'),
          templateTypes: config.templateTypes,
          defaultSavePath: path.join(os.homedir(), 'EdgerOSApps'),
          incloud: true
        }
      })
    } else if (message.type === 'createProject') { // Create project
      const tplInfo = message.data.tplData
      let newProjectPath: string = ''
      if (tplInfo?.location === 'local') {
        newProjectPath = await localMode(tplInfo, message.data)
      } else if (tplInfo?.location === 'cloud') {
        newProjectPath = await cloudMode(tplInfo, message.data)
      }

      if (message.data.other.indexOf('openFile') !== -1) {
        const newProUri = vscode.Uri.file(newProjectPath)
        await vscode.commands.executeCommand(
          'vscode.openFolder',
          newProUri, {
            forceNewWindow: true
          }
        )
      }

      // 创建完成返回数据
      currentPanel?.webview.postMessage({
        type: '_createProject',
        data: 'success'
      })
      currentPanel.dispose()
    }
  } catch (err) {
    currentPanel.dispose()
    vscode.window.showInformationMessage(err.message)
  }
}
