
import * as vscode from 'vscode'
import { getGiteeTpls } from './gitlib/gitee_api'
import { getGithubTpls } from './gitlib/github_api'

const templatesList = require('../../templates/templates_config.json')

// device list storage key
export const devsStateKey: string = 'EgerOs_Devs'
// edgeros log png ,webview use
export const edgerosLogo: string = 'https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/logo.png'
export const edgerosIdePort: number = 82
export const edgerConsolePort: number = 81
// show WebView
export const edgerOsWebData: any = [
  {
    url: 'https://www.edgeros.com/edgeros/api/overview.html',
    title: 'API Documentation',
    'title_zh-cn': '参考手册'
  }
]

/**
 * [{
 * tempName: "模板名称",
 * description:"模板简介",
 * icon:"模板图片",
 * gitUrl:"git地址",
 * downloadUrl:"下载地址",
 * type:"模板类型",//enum[templateTypes]
 * location:"local",// local or cloud
 * }]
 *
 * type:local / all
 *
 */
export async function getTemplatesList (type: string) {
  const sourceType = vscode.workspace.getConfiguration('edgeros').get('templateSource')
  let cloudTpl = []
  if (type === 'all') {
    if (sourceType === 'github') {
      cloudTpl = await getGithubTpls()
    } else if (sourceType === 'gitee') {
      cloudTpl = await getGiteeTpls()
    }

    // 过滤本地已存在的相同模板
    cloudTpl = cloudTpl.filter((cloudItem: any) => {
      const item = templatesList.find((localItem: any) => {
        return cloudItem.tempName === localItem.tempName
      })
      return !item
    })
  }
  return templatesList.concat(cloudTpl)
}

/**
 * 模板类型及模板介绍
 */
export const templateTypes = [{
  type: 'All',
  desc: ''
},
{
  type: 'Base',
  desc: 'Converges basic template types'
}]
