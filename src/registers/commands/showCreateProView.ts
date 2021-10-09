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

import * as config from '../../config'
import { nlsConfig } from '../../nls'
import localMode from '../../generate/localMode'
import cloudMode from '../../generate/cloudMode'

import { getTemplateInfo } from '../../generate/templateProvider'
import { changeUri, getWebViewBaseUris } from '../../common'
import { EdgerosProjectConfig, TemplateSource } from '../../types'
import { appendLine } from '../../components/output'

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
      const assetUris = await getWebViewBaseUris(webViewFileName, currentPanel, context)
      // get css uri
      const cssUri = changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'))
      // get base64 images
      const baseImagesUrl = changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'baseImages.js'))
      // set html
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris,
        cssUri,
        baseImagesUrl,
        language: {
          nameTxt: localize('name.txt', 'Name'),
          bundleIdTxt: localize('bundleId.txt', 'Bundle ID'),
          savePathTxt: localize('savePath.txt', 'Save Path'),
          descriptionTxt: localize('Description.txt', 'Description'),
          versionTxt: localize('version.txt', 'Version'),
          vendorIdTxt: localize('vendorId.txt', 'Vendor ID'),
          vendorNameTxt: localize('vendorName.txt', 'Vendor Name'),
          vendorEmailTxt: localize('vendorEmail.txt', 'Vendor Email'),
          vendorPhoneTxt: localize('vendorPhone.txt', 'Vendor Phone'),
          vendorFaxTxt: localize('vendorFax.txt', 'Vendor Fax'),
          createButtonTxt: localize('createButton.txt', 'Create'),
          otherText: localize('other.txt', 'Other'),
          openFileText: localize('openFile.txt', 'Open the project in a new window'),
          selectPathText: localize('selectPath.txt', 'Select Path'),
          nameNotEmptyText: localize('nameNotEmpty.txt', 'Name is required'),
          projectTemplateWarehouseTxt: localize('projectTemplateWarehouse.txt', 'Template Warehouse'),
          projectTemplateHintTxt: localize('projectTemplateHint.txt', 'Select the template and build it now'),
          applyTxt: localize('apply.txt', 'Apply'),
          applyNowTxt: localize('applyNow.txt', 'Apply Now'),
          bundleIdNotEmptyText: localize('bundleIdNotEmptyText.txt', 'Bundle ID is required'),
          bundleIdIncorrectFormatText: localize('bundleIdIncorrectFormatText.txt', 'It needs to be formatted: [a-z]([a-z0-9-]*)(\\.([a-z0-9-]+)){2,}'),
          versionNotEmptyText: localize('versionNotEmptyText.txt', 'Version is required'),
          versionIncorrectFormatText: localize('versionIncorrectFormatText.txt', 'Version should be like 0.1.2'),
          vendorIdNotEmptyText: localize('vendorIdNotEmptyText.txt', 'Vendor ID is required'),
          vendorIdIncorrectFormatText: localize('vendorIdIncorrectFormatText.txt', 'It needs to be formatted: ^[0-9a-zA-Z_-]{1,40}$'),
          vendorNameNotEmptyText: localize('vendorNameNotEmptyText.txt', 'Vendor name is required'),
          invalidEmailText: localize('invalidEmailText.txt', 'Invalid email address'),
          emailNotEmptyText: localize('emailNotEmptyText.txt', 'Email is required'),
          invalidPhoneText: localize('invalidPhoneText.txt', 'Invalid phone number'),
          refreshTemplateingText: localize('refreshTemplateingText.txt', 'Getting a template'),
          refreshTemplateText: localize('refreshTemplateText.txt', 'Refresh the templates'),
          switchTemplateSourceAlerText: localize('switchTemplateSourceAlert.txt', 'The template source can be switched by clicking vscode "File - > Preferences - > Settings"'),
          vendorIdAlertText: localize('vendorIdAlert.txt', 'The Provider ID (Developer ID) can be found on the personal information page of EdgerOS official website ( https://www.edgeros.com )')
        }
      })

      // reception webview message
      currentPanel.webview.onDidReceiveMessage(async message => {
        webCmdHandle(context, currentPanel as vscode.WebviewPanel, message)
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
async function webCmdHandle (context: vscode.ExtensionContext, currentPanel: vscode.WebviewPanel, message: any) {
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
      const templateInfo = await getTemplateInfo(context, message.refresh)
      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: templateInfo.templates,
          templateTypes: templateInfo.templateTypes,
          defaultSavePath: path.join(os.homedir(), 'EdgerOSApps'),
          incloud: true
        }
      })
    } else if (message.type === 'createProject') { // Create project
      const tplInfo = message.data.tplData
      const tplLocaltion = tplInfo.location as TemplateSource
      let newProjectPath: string = ''

      if (tplLocaltion === 'Local') {
        newProjectPath = await localMode(tplInfo, message.data as EdgerosProjectConfig)
      } else {
        newProjectPath = await cloudMode(tplInfo, message.data as EdgerosProjectConfig, appendLine)
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
  } catch (err: any) {
    currentPanel.dispose()
    vscode.window.showInformationMessage(err.message)
  }
}
