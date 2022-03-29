/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Wenhao <fuwenhao@acoinfo.com>
 * File   : treeItem.ts
 * Desc   : description
 */
import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from '../nls'

/**
 * Device list tree view item
 */
export class EdgerosTreeItem extends vscode.TreeItem {
  constructor (
    public label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public type: string,
    public options?: any
  ) {
    super(label, collapsibleState)
    this.setIconPath(type, options)
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

  setIconPath (type: string, options?: any) {
    let iconPath: { dark: string, light: string }
    const iconBaseUrl = path.join(__dirname, '..', '..', 'resources', 'icon')
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
      case 'web':
        iconPath = { dark: path.join(iconBaseUrl, 'dark', options?.icon), light: path.join(iconBaseUrl, 'light', options?.icon) }
        break
      default:
        iconPath = { dark: path.join(iconBaseUrl, 'dark', 'threeView_other.svg'), light: path.join(iconBaseUrl, 'light', 'threeView_other.svg') }
    }
    this.iconPath = iconPath
  }
}
