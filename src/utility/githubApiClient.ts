/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : githubClient.ts
 * Desc   : Github API client to fetch from templates metadata repo
 */

import * as path from 'path'
import { URL } from 'url'
import axios, { AxiosRequestConfig } from 'axios'
import type { AxiosProxyConfig } from 'axios'
import { ErrorHandler, GithubFileResponse, Template, TemplateConfig, TemplateSource, TemplateType, TemplateInfo } from '../types'

const providers = {
  github: 'https://api.github.com/repos/edgeros/templates/contents/',
  gitee: 'https://gitee.com/api/v5/repos/edgeros/templates/contents'
}

/**
 * List repo directories inside the Github metadata repo
 * @param errHandler callback to be invoked when error is encountered
 */
export async function getGithubTpls (errHandler?: ErrorHandler, proxyStr?: string): Promise<TemplateInfo> {
  const proxy = parseHttpsProxy(proxyStr)
  return await loadTemplatesRepo(providers.github, 'Github', errHandler, proxy)
}

/**
 * List repo directories inside the Github metadata repo
 * @param errHandler callback to be invoked when error is encountered
 */
export async function getGiteeTpls (errHandler?: ErrorHandler): Promise<TemplateInfo> {
  return await loadTemplatesRepo(providers.gitee, 'Gitee', errHandler)
}

/**
 * List repo directories inside the `templates` metadata repository
 * @param errHandler
 */
async function loadTemplatesRepo (
  apiUrl: string,
  source: TemplateSource,
  errHandler?: ErrorHandler,
  proxy?: AxiosProxyConfig
): Promise<TemplateInfo> {
  try {
    const response = await axios(apiUrl, { proxy })
    // gets the types of all templates
    const repoFetcheTypesUrl = response.data
      .filter((item: any) => item.name === 'tpl-types.json' && item.type === 'file')[0]
      .download_url
    const repoFectheTypes = await loadTemplateType(repoFetcheTypesUrl, proxy)
    // get details about the template
    const repoFetches = response.data
      .filter((item: any) => item && item.type === 'dir')
      .map((item: any) => loadTemplate(item.url, item.name, source, proxy))
    // filtering failed to obtain templates
    let repoFetchesInfo: Template[] = await Promise.all(repoFetches)
    repoFetchesInfo = repoFetchesInfo.filter((item: Template) => !!item.id)
    return {
      typeArray: repoFectheTypes,
      tempArray: repoFetchesInfo
    } as TemplateInfo
  } catch (err:any) {
    errHandler && errHandler(err)
    return {
      typeArray: [],
      tempArray: []
    } as TemplateInfo
  }
}

/**
 * Request github repository API and retrieve detailed repo infomation
 * @param templateId template repo directory name the metadata repo
 * @param templateUrl template github repository, i.e.
 *  https://api.github.com/repos/edgeros/templates/contents/tpl-standard?ref=main
 */
async function loadTemplate (templateUrl: string, templateId: string, source: TemplateSource, proxy?: AxiosProxyConfig): Promise<Template> {
  const conventionalFiles: { [key: string]: any } = {
    'desc.json': undefined,
    'banner.png': undefined
  }
  const conventialFileNames = new Set(Object.keys(conventionalFiles))
  try {
    const response = await axios(templateUrl, { proxy })
    const httpGets = (response.data as GithubFileResponse[])
      .filter(item => conventialFileNames.has(item.name))
      .map(item => {
        const extname = path.extname(item.name).toLowerCase()
        const axiosOptions = (function (): AxiosRequestConfig {
          switch (extname) {
            case '.png':
              return { proxy, responseType: 'arraybuffer' }
            default:
              return { proxy }
          }
        })()

        return axios(item.download_url, axiosOptions)
          .then(res => {
            conventionalFiles[item.name] = res.data
          })
      })

    await Promise.all(httpGets)

    const descJson = conventionalFiles['desc.json'] as TemplateConfig
    const bannerPng = conventionalFiles['banner.png'] as ArrayBuffer
    const gitUrl = source === 'Github'
      ? descJson.repository.github!!.toString()
      : descJson.repository.gitee!!.toString()

    if (!descJson.banner) {
      // banner field empty, use the provided banner.png
      return {
        ...descJson,
        id: templateId,
        source: source,
        gitUrl: gitUrl,
        banner: `data:image/png;base64,${Buffer.from(bannerPng).toString('base64')}`
      } as Template
    }
    return { ...descJson, id: templateId, source, gitUrl } as Template
  } catch (err) {
    return {} as Template
  }
}

/**
 * Request github repository API and retrieve detailed repo infomation
 * @param typesFileUrl Template type file download address
 * https://github.com/edgeros/templates/raw/main/tpl-types.json
 */
async function loadTemplateType (typesFileUrl: string, proxy?: AxiosProxyConfig): Promise<TemplateType[]> {
  try {
    const response = await axios(typesFileUrl, { proxy })
    return response.data.map((item: any) => {
      return item as TemplateType
    })
  } catch (err) {
    return [] as TemplateType[]
  }
}

function parseHttpsProxy (envHttpsProxy?: string): AxiosProxyConfig | undefined {
  if (envHttpsProxy) {
    const url = new URL(envHttpsProxy)
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: Number.parseInt(url.port)
    }
  }
}
