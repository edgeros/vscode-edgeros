/*
 * @Author: FuWenHao
 * @Date: 2021-04-16 14:29:46
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-22 11:04:27
 */
import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from '../nls'

/**
 *
 *EOSTreeItem is View show item class
 *
 *type: deviceList / other / device
 *
 */
export class EOSTreeItem extends vscode.TreeItem {
  constructor (
    public label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public type: string,
    public options?: any
  ) {
    super(label, collapsibleState)
    this.setIconPath(type)
    this.setCommand(type)
    this.contextValue = type
  }

  setCommand (type: string) {
    if (type === 'device') {
      this.command = {
        command: 'edgeros.showDevInfoView',
        title: 'Show Devices Info',
        arguments: [this]
      }
    } else if (type === 'web') {
      this.label = this.options['title_' + nls.languge] || this.options.title
      this.options.showTitle = this.label
      this.command = {
        command: 'edgeros.showWebView',
        title: 'Show Web View',
        arguments: [this.options]
      }
    } else if (type === 'buildEap') {
      this.command = {
        command: 'edgeros.buildEap',
        title: 'Build EdgerOS App'
      }
    }
  }

  setIconPath (type: string) {
    let iconPath: { dark: string, light: string }
    const iconBaseUrl = path.join(__dirname, '..', '..', '..', 'resources', 'icon')
    switch (type) {
      case 'deviceList':
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_deviceList.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_deviceList.svg') }
        break
      case 'device':
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_device.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_device.svg') }
        break
      case 'other':
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_other.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_other.svg') }
        break
      case 'buildEap':
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'command_buildEap.svg'), light: path.join(iconBaseUrl, 'light', 'command_buildEap.svg') }
        break
      default:
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_other.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_other.svg') }
    }
    this.iconPath = iconPath
  }
}
