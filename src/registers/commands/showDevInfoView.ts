/*
 * @Author: FuWenHao
 * @Date: 2021-04-12 20:00:47
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-07 14:34:36
 */
import * as vscode from 'vscode'
import * as ejs from 'ejs'
import * as path from 'path'
import { EdgerosTreeItem } from '../../components/treeItem'
import nlsConfig from '../../nls'
import { getGlobalState, setGlobalState, changeUri, getWebViewBaseUris, selectedDevice } from '../../common'
const localize = nlsConfig(__filename)

/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined
  let deviceInfo: { devId: string, devName: string, devIp: string, devPwd: string } | undefined

  const disposable = vscode.commands.registerCommand('edgeros.showDevInfoView', async (...options: EdgerosTreeItem[]) => {
    try {
      await vscode.commands.executeCommand('edgeros.refreshThreeView')
      let devsArray = getGlobalState(context)
      if (!devsArray) return

      const tmpDevInfo = await selectedDevice(context, options)
      if (!tmpDevInfo) return

      if (deviceInfo?.devId !== tmpDevInfo.devId) { currentPanel?.dispose() }
      deviceInfo = tmpDevInfo
      const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
      if (currentPanel) {
        currentPanel.reveal(columnToShowIn)
      } else {
        const title = localize('devInfo.txt', 'EdgerOS Information')
        currentPanel = vscode.window.createWebviewPanel('devInfoView', title, vscode.ViewColumn.One, {
          enableScripts: true
        })
        const webViewFileName = 'deviceInfo'
        const assetUris = await getWebViewBaseUris(webViewFileName, currentPanel, context)
        const indexCssUri = changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'))
        // set html str
        currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
          ...assetUris,
          indexCssUri: indexCssUri,
          language: {
            devIpTxt: localize('devIp.txt', 'Device IP'),
            devNameTxt: localize('devName.txt', 'Device Name'),
            devPwdTxt: localize('devPwd.txt', 'Device Password'),
            devUpdate: localize('devUpdate.txt', 'Update'),
            devDelete: localize('devDelete.txt', 'Delete'),
            ipNotEmptyText: localize('ipNotEmpty.Text', 'IP Not Empty'),
            ipIncorrectFormatText: localize('ipIncorrectFormat.text', 'IP Incorrect Format'),
            devNameNotEmptyText: localize('devNameNotEmpty.Text', 'Device Name Not Empty'),
            devNameExistText: localize('devNameExist.Text', 'Device Name Exist'),
            devDeleteHintTitleText: localize('devDeleteHintTitle.Text', 'Hint'),
            devDeleteHintContextText: localize('devDeleteHintContext.Text', 'Are you sure to delete this device?'),
            devDeleteHintYesButtonText: localize('devDeleteHintYesButton.Text', 'Confirm'),
            devDeleteHintNoButtonText: localize('devDeleteHintNoButton.Text', 'Cancel')
          }
        })
        currentPanel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'logo.png'))
        currentPanel.webview.onDidReceiveMessage(
          async message => {
            // update Device
            if (message.type === 'update') {
              devsArray = devsArray!!.map(item => {
                if (item.devId === message.data.devId) {
                  item = message.data
                }
                return item
              })
              await setGlobalState(context, devsArray)
              await vscode.commands.executeCommand('edgeros.refreshThreeView')
              currentPanel?.dispose()
            } else if (message.type === 'delete') { // delete devoce
              devsArray = devsArray!!.filter(item => {
                return !(item.devId === message.data.devId)
              })
              await setGlobalState(context, devsArray)
              await vscode.commands.executeCommand('edgeros.refreshThreeView')
              currentPanel?.dispose()
            } else if (message.type === 'getDeviceData') { // return device List
              currentPanel?.webview.postMessage({
                type: '_getDeviceData',
                data: {
                  devices: devsArray,
                  deviceInfo: deviceInfo
                }
              })
            }
          },
          undefined,
          context.subscriptions
        )
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined
            deviceInfo = undefined
          },
          null,
          context.subscriptions
        )
      }
    } catch (err) {
      console.error(err)
    }
  })
  context.subscriptions.push(disposable)
};
