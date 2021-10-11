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
import { Template, TemplateSource, TemplateType, TemplateViewItem, TemplateTypeViewItem, TemplateInfo } from '../types'
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
export async function getTemplateInfo (context: vscode.ExtensionContext, refresh?: boolean): Promise<TemplateAndTypeData> {
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

    const templateDataCache: TempTypeOriginal | undefined = context.globalState.get(edgerosGlobalStateKeyTemplates)
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
      context.globalState.update(edgerosGlobalStateKeyTemplates, cacheData)
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
    context.globalState.update(edgerosGlobalStateKeyTemplates, undefined)
    return {
      templates: [],
      templateTypes: []
    }
  }
}

function buildTemplateViewItem (template: Template): TemplateViewItem {
  let description:string
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
  let label:string
  const labelLanguage = 'label_' + languge
  if (labelLanguage in templateType) {
    label = (templateType as any)[labelLanguage]
  } else {
    label = templateType.label
  }

  let description:string
  const descriptionLanguage:string = 'description_' + languge
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
