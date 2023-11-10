/*
 * @Author: FuWenHao
 * @Date: 2021-04-10 18:05:14
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-07 14:37:28
 */
import * as vscode from 'vscode'
import * as config from '../../config'
import { EdgerosTreeItem } from '../../components/treeItem'
import nlsConfig from '../../nls'
import { getGlobalState, getEdgerOSProjectInfo } from '../../common'

const localize = nlsConfig(__filename)

/**
 * Eos Manage View Provider
 */
class EOSManageViewProvider implements vscode.TreeDataProvider<EdgerosTreeItem> {
  constructor (private workspaceRoot: string, private context: vscode.ExtensionContext) {

  }

  private _onDidChangeTreeData: vscode.EventEmitter<EdgerosTreeItem | undefined | null | void> = new vscode.EventEmitter<EdgerosTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<EdgerosTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

  getTreeItem (element: EdgerosTreeItem): vscode.TreeItem {
    return element
  }

  getChildren (element?: EdgerosTreeItem): Promise<EdgerosTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.showTreeRootItem())
    } else {
      let children: EdgerosTreeItem[]
      switch (element.type) {
        case 'deviceList':
          children = this.getDeviceList(this.context)
          break
        case 'other':
          children = this.getOtherList(this.context)
          break
        default:
          return Promise.resolve([])
      }

      return Promise.resolve(children)
    }
  }

  /**
   * get local save device
   * @returns
   */
  getDeviceList (context: vscode.ExtensionContext) {
    const devices: EdgerosTreeItem[] = []
    let devList = getGlobalState(context) || []
    devList = devList.filter((item) => {
      return !!item.devId
    })
    devList.forEach((item: any) => {
      devices.push(new EdgerosTreeItem(item.devName, vscode.TreeItemCollapsibleState.None, 'device'))
    })
    return devices
  }

  /**
   * get other
   * @returns
   */
  getOtherList (context: vscode.ExtensionContext) {
    const items = [{
      icon: 'command_handbook.svg',
      url: config.edgerosWebResources.apiDoc,
      title: localize('apiDocument.txt', 'API Document')
    }].map(webItem => {
      return new EdgerosTreeItem(webItem.title, vscode.TreeItemCollapsibleState.None, 'web', webItem)
    })

    items.push(new EdgerosTreeItem(localize('buildEAP.txt', 'Build EdgerOS App'),
      vscode.TreeItemCollapsibleState.None, 'buildEap'))
    return items
  }

  /**
   * EOS pulgin show view root dir
   * @returns
   */
  private showTreeRootItem (): EdgerosTreeItem[] {
    const newProject = new EdgerosTreeItem(localize('deviceList.txt', 'Devices'), vscode.TreeItemCollapsibleState.Expanded, 'deviceList')
    const devicesDir = new EdgerosTreeItem(localize('other.txt', 'Other'), vscode.TreeItemCollapsibleState.Collapsed, 'other')
    return [newProject, devicesDir]
  }

  /**
   * refresh three view
   */
  refresh (): void {
    this._onDidChangeTreeData.fire()
  }
}

let threeViewProvider: EOSManageViewProvider

/**
 *Edgeros device  view Tree
 *@param {object} context
 *@param {boolean} manual 默认是false,在非爱智项目中用户可手动进入控制台界面
 */
 export = async function (context: vscode.ExtensionContext, manual = false) {
   // 用户手动进入控制台
   if (manual === true && !threeViewProvider) {
     threeViewProvider = new EOSManageViewProvider('', context)
     vscode.window.registerTreeDataProvider(
       'eosManageView',
       threeViewProvider
     )

     // register Command
     vscode.commands.registerCommand('edgeros.refreshThreeView', () =>
       threeViewProvider.refresh()
     )

     return
   }

   if (vscode.workspace.workspaceFolders) {
     // check Edgeros Project
     const projectPathArray = await getEdgerOSProjectInfo(context)
     if (projectPathArray.projectPaths.length > 0) {
       threeViewProvider = new EOSManageViewProvider(vscode.workspace.workspaceFolders[0].uri.fsPath, context)
       vscode.window.registerTreeDataProvider(
         'eosManageView',
         threeViewProvider
       )

       // register Command
       vscode.commands.registerCommand('edgeros.refreshThreeView', () =>
         threeViewProvider.refresh()
       )
     }
   }
 };
