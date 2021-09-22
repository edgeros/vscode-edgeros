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

import * as path from 'path'
import { promises as fs } from 'fs'
import { pathToFileURL } from 'url'
import { Template, TemplateSource } from '../types'
import { getGithubTpls, getGiteeTpls } from '../utility/githubApiClient'

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
