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
import { nlsConfig, languge } from '../../nls'
import localMode from '../../generate/localMode'
import cloudMode from '../../generate/cloudMode'

import { getLocalTemplates, getRemoteTemplates } from '../../generate/templateProvider'
import { getWorkspaceSettings, changeUri, getWebViewBaseUris } from '../../common'
import { EdgerosProjectConfig, Template, TemplateSource, TemplateType } from '../../types'
import { appendLine } from '../../components/output'

const localize = nlsConfig(__filename)

interface TemplateViewItem {
  name: string; // descJsonRes.data.name,
  description: string; // descJsonRes.data.description,
  banner: string; // bannerImg.download_url,
  gitUrl: string; // gitUrl,
  downloadUrl: string; // gitUrl,
  type: string; // descJsonRes.data.type,
  location: string // 'cloud'
}

interface TemplateTypeViewItem {
  type: string; // 模板类型
  label: string; // 页面显示标题
  desc: string; // 模板类型描述
}

/**
 * 模板类型及模板介绍(单机情况下)
 */
const templateTypes: TemplateTypeViewItem[] = [{
  type: 'All',
  label: languge === 'zh-cn' ? '全部' : 'All',
  desc: languge === 'zh-cn' ? '所有的应用模板' : 'All available project templates'
},
{
  type: 'Base',
  label: languge === 'zh-cn' ? '基础' : 'Base',
  desc: languge === 'zh-cn' ? '比较基础应用模板' : 'Basic project templates'
}]

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
      // set html
      currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
        ...assetUris,
        cssUri,
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
          cloudText: localize('cloudText.txt', 'Cloud')
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
  const settings = getWorkspaceSettings()
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
      const localTemplates = await getLocalTemplates()
      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: localTemplates.map(buildTemplateViewItem),
          templateTypes: templateTypes,
          defaultSavePath: path.join(os.homedir(), 'EdgerOSApps'),
          incloud: false
        }
      })
      const remoteTemplates = await getRemoteTemplates(settings.templateSource)
      const allTemplates = localTemplates.concat(remoteTemplates.tempArray)
      for (const item of remoteTemplates.typeArray.map(buildTemplateTypeItem)) {
        const index = templateTypes.findIndex((localItem: TemplateTypeViewItem) => {
          return item.type === localItem.type
        })
        if (index === -1) {
          templateTypes.push(item)
        }
      }

      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: allTemplates.map(buildTemplateViewItem),
          templateTypes: templateTypes,
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

function buildTemplateViewItem (template: Template): TemplateViewItem {
  return {
    name: template.name,
    description: languge === 'zh-cn' ? template['description_zh-cn'] : template.description,
    banner: template.banner,
    type: template.type,
    gitUrl: template.gitUrl,
    downloadUrl: template.gitUrl,
    location: template.source
  }
}

function buildTemplateTypeItem (templateType: TemplateType): TemplateTypeViewItem {
  return {
    type: templateType.type,
    label: languge === 'zh-cn' ? templateType['label_zh-cn'] : templateType.type,
    desc: languge === 'zh-cn' ? templateType['describe_zh-cn'] : templateType.describe_en
  }
}
