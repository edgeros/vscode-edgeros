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
import { changeUri, getWebViewBaseUris, getWorkspaceSettings } from '../../common'
import { EdgerosProjectConfig, TemplateSource, TemplateType, TemplateViewItem, TemplateTypeViewItem, Template, TemplateInfo } from '../../types'
import { appendLine } from '../../components/output'
import { getUserInfo, setUserInfo, setUserInfoUpdateCallBack, UserInfo } from '../../components/loginBar'

const localize = nlsConfig(__filename)
const i18n = {
  selectProjectDir: localize('selectProjectDir.txt', 'Open the project in a new window'),
  templateViewAll: localize('templateViewAll.txt', 'All'),
  templateViewAllDesc: localize('templateViewAllDesc.txt', 'All available project templates'),
  templateViewBase: localize('templateViewBase.txt', 'Base'),
  templateViewBaseDesc: localize('templateViewBaseDesc.txt', 'Basic project templates')
}

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
      const title = localize('createProject.txt', 'Create Project')
      currentPanel = vscode.window.createWebviewPanel('createProject', title, vscode.ViewColumn.One, {
        enableScripts: true
      })

      currentPanel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'logo.png'))

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
          nameIncorrectFormatText: localize('nameIncorrectFormatText.txt', 'It needs to be formatted: ^[\\\\u4e00-\\\\u9fa5a-zA-Z0-9][\\\\u4e00-\\\\u9fa5a-zA-Z0-9\\\\s_\\\\-~#@]+$'),
          projectTemplateWarehouseTxt: localize('projectTemplateWarehouse.txt', 'Template Warehouse'),
          projectTemplateHintTxt: localize('projectTemplateHint.txt', 'Select the template and build it now'),
          applyTxt: localize('apply.txt', 'Apply'),
          applyNowTxt: localize('applyNow.txt', 'Apply Now'),
          bundleIdNotEmptyText: localize('bundleIdNotEmptyText.txt', 'Bundle ID is required'),
          bundleIdIncorrectFormatText: localize('bundleIdIncorrectFormatText.txt', 'It needs to be formatted: [a-z]([a-z0-9-]*)(\\\\.([a-z0-9-]+)){2,}'),
          versionNotEmptyText: localize('versionNotEmptyText.txt', 'Version is required'),
          versionIncorrectFormatText: localize('versionIncorrectFormatText.txt', 'Version should be like 0.1.2'),
          vendorIdNotEmptyText: localize('vendorIdNotEmptyText.txt', 'Vendor ID is required'),
          vendorIdIncorrectFormatText: localize('vendorIdIncorrectFormatText.txt', 'It needs to be formatted: ^[0-9a-zA-Z_-]{1,40}$'),
          vendorNameNotEmptyText: localize('vendorNameNotEmptyText.txt', 'Vendor name is required'),
          invalidEmailText: localize('invalidEmailText.txt', 'Invalid email address'),
          emailNotEmptyText: localize('emailNotEmptyText.txt', 'Email is required'),
          invalidPhoneText: localize('invalidPhoneText.txt', 'Invalid phone number'),
          invalidFaxText: localize('invalidFaxText.txt', 'Invalid fax number'),
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

      setUserInfoUpdateCallBack((userInfo:UserInfo) => {
        currentPanel?.webview.postMessage({
          type: '_getUserInfo',
          data: { userInfo }
        })
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
        title: i18n.selectProjectDir
      })

      if (selectSavePath) {
        context.globalState.update(config.projectPathSave, selectSavePath[0].fsPath)
        currentPanel?.webview.postMessage({
          type: '_selectSavePath',
          data: selectSavePath[0].fsPath
        })
      }
    } else if (message.type === 'getInfoData') { // Send template list and template Types
      const templateInfo = await getTemplateInfo(context, message.refresh)
      const savePath = context.globalState.get(config.projectPathSave) || path.join(os.homedir(), 'EdgerOSApps')
      currentPanel?.webview.postMessage({
        type: '_getInfoData',
        data: {
          templates: templateInfo.templates,
          templateTypes: templateInfo.templateTypes,
          defaultSavePath: savePath,
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
      currentPanel?.webview.postMessage({
        type: '_createProject',
        data: 'success'
      })
      currentPanel.dispose()
    } else if (message.type === 'cancelLoginAlert') {
      const userInfo = getUserInfo(context)
      userInfo.alert = false
      setUserInfo(context, userInfo)
    } else if (message.type === 'callLoginbar') {
      vscode.commands.executeCommand('edgeros.login')
    } else if (message.type === 'getUserInfo') {
      const userInfo = getUserInfo(context)
      currentPanel?.webview.postMessage({
        type: '_getUserInfo',
        data: { userInfo }
      })
    }
  } catch (err: any) {
    currentPanel.dispose()
    vscode.window.showInformationMessage(err.message)
  }
}

/**
 * 获取模板数据所有模板数据 (本地+云端) 及版本信息
 * @context vscode拓展上下文
 * @return {templates: TemplateViewItem[],templateTypes:TemplateTypeViewItem[]}
 */
// 接口返回数据类型
interface TemplateAndTypeData {
  templates: TemplateViewItem[];
  templateTypes: TemplateTypeViewItem[];
}

// 存储模板原始数据数据类型
interface TempTypeOriginal {
  localTemplates: Template[];
  remoteTemplates: TemplateInfo;
}
async function getTemplateInfo (context: vscode.ExtensionContext, refresh?: boolean): Promise<TemplateAndTypeData> {
  try {
    const templateTypes: TemplateTypeViewItem[] = [{
      type: 'all',
      label: languge === 'zh-cn' ? '全部' : 'All',
      desc: languge === 'zh-cn' ? '所有的应用模板' : 'All available project templates'
    },
    {
      type: 'base',
      label: languge === 'zh-cn' ? '基础' : 'Base',
      desc: languge === 'zh-cn' ? '比较基础应用模板' : 'Basic project templates'
    }]

    const templateDataCache: TempTypeOriginal | undefined = context.globalState.get(config.edgerosGlobalStateKeyTemplates)
    let localTemplates: Template[]
    let remoteTemplates: TemplateInfo

    if (refresh || !templateDataCache) {
      const settings = getWorkspaceSettings()
      localTemplates = await getLocalTemplates()
      remoteTemplates = await getRemoteTemplates(settings.templateSource)
      const cacheData: TempTypeOriginal = {
        localTemplates: localTemplates,
        remoteTemplates: remoteTemplates
      }
      context.globalState.update(config.edgerosGlobalStateKeyTemplates, cacheData)
    } else {
      localTemplates = templateDataCache.localTemplates
      remoteTemplates = templateDataCache.remoteTemplates
    }

    const allTemplates = localTemplates.concat(remoteTemplates.tempArray)
    for (const item of remoteTemplates.typeArray.map(buildTemplateTypeItem)) {
      const index = templateTypes.findIndex((localItem: TemplateTypeViewItem) => {
        return item.type === localItem.type
      })
      if (index === -1) {
        templateTypes.push(item)
      }
    }

    return {
      templates: allTemplates.map(buildTemplateViewItem),
      templateTypes: templateTypes
    }
  } catch (err) {
    context.globalState.update(config.edgerosGlobalStateKeyTemplates, undefined)
    return {
      templates: [],
      templateTypes: []
    }
  }
}

function buildTemplateViewItem (template: Template): TemplateViewItem {
  let description: string
  const descLanguage = 'description_' + languge
  if (descLanguage in template) {
    description = (template as any)[descLanguage]
  } else {
    description = template.description
  }

  return {
    name: template.name,
    description: description,
    banner: template.banner,
    type: template.type,
    gitUrl: template.gitUrl,
    downloadUrl: template.gitUrl,
    location: template.source,
    root: template.root
  }
}

function buildTemplateTypeItem (templateType: TemplateType): TemplateTypeViewItem {
  let label: string
  const labelLanguage = 'label_' + languge
  if (labelLanguage in templateType) {
    label = (templateType as any)[labelLanguage]
  } else {
    label = templateType.label
  }

  let description: string
  const descriptionLanguage: string = 'description_' + languge
  if (descriptionLanguage in templateType) {
    description = (templateType as any)[descriptionLanguage]
  } else {
    description = templateType.description
  }

  return {
    type: templateType.type,
    label: label,
    desc: description
  }
}
