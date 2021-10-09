/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : provider.ts
 * Desc   : project template provider
 */
import * as vscode from 'vscode'
import * as path from 'path'
import { promises as fs } from 'fs'
import { pathToFileURL } from 'url'
import { Template, TemplateSource, TemplateType, TemplateViewItem, TemplateTypeViewItem } from '../types'
import { getGithubTpls, getGiteeTpls } from '../utility/githubApiClient'
import { getWorkspaceSettings } from '../common'
import { languge } from '../nls'
import { edgerosGlobalStateKeyTemplates } from '../config'
/**
 * Load built-in template metadata
 * @param localTemplateBase where to locate local templates
 */
export async function getLocalTemplates (localTemplateBase?: string) {
  const localDir = localTemplateBase || path.join(__dirname, '../../templates')
  const metaFile = path.join(localDir, 'metadata.json')
  const metaJson = await fs.readFile(metaFile, 'utf-8')
  const metadata = JSON.parse(metaJson)

  const result: Array<Template> = []
  for (const dir of Object.keys(metadata)) {
    const templateConf = metadata[dir]
    const templateDir = path.join(localDir, dir)
    const template: Template = {
      id: dir,
      name: templateConf.name!,
      banner: templateConf.banner!,
      description: templateConf.description!,
      'description_zh-cn': templateConf['description_zh-cn']!,
      type: templateConf.type!,
      source: 'Local',
      gitUrl: pathToFileURL(templateDir).toString()
    }
    result.push(template)
  }
  return result
}

/**
 * Load from remote `templates` metadata repo for all 3rd party tempaltes
 */
export async function getRemoteTemplates (source: TemplateSource) {
  switch (source) {
    case 'Github':
      return await getGithubTpls()
    case 'Gitee':
      return await getGiteeTpls()
    default:
      throw Error(`unknown template source: ${source}`)
  }
}

/**
 * 获取模板数据所有模板数据 (本地+云端) 及版本信息
 * @context vscode拓展上下文
 * @return {templates: TemplateViewItem[],templateTypes:TemplateTypeViewItem[]}
 */
interface TemplateInfo {
  templates: TemplateViewItem[];
  templateTypes: TemplateTypeViewItem[];
}
export async function getTemplateInfo (context: vscode.ExtensionContext, refresh?: boolean): Promise<TemplateInfo> {
  let templateData: TemplateInfo | undefined
  templateData = context.globalState.get(edgerosGlobalStateKeyTemplates)
  if (refresh || !templateData) {
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
    const settings = getWorkspaceSettings()
    const localTemplates = await getLocalTemplates()
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
    templateData = {
      templates: allTemplates.map(buildTemplateViewItem),
      templateTypes: templateTypes
    }
    context.globalState.update(edgerosGlobalStateKeyTemplates, templateData)
  }
  return templateData
}

function buildTemplateViewItem (template: Template): TemplateViewItem {
  return {
    name: template.name,
    description: languge === 'zh-cn' ? template['description_zh-cn'] : template.description,
    banner: template.banner,
    type: template.type,
    gitUrl: template.gitUrl,
    downloadUrl: template.gitUrl,
    location: template.source,
    root: template.root
  }
}

function buildTemplateTypeItem (templateType: TemplateType): TemplateTypeViewItem {
  return {
    type: templateType.type,
    label: languge === 'zh-cn' ? templateType['label_zh-cn'] : templateType.type,
    desc: languge === 'zh-cn' ? templateType['describe_zh-cn'] : templateType.describe_en
  }
}
