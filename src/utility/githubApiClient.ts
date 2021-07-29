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
import { ErrorHandler, GithubFileResponse, Template, TemplateConf, TemplateSource } from '../types'

const providers = {
  github: 'https://api.github.com/repos/edgeros/templates/contents/',
  gitee: 'https://gitee.com/api/v5/repos/edgeros/templates/contents'
}

/**
 * List repo directories inside the Github metadata repo
 * @param errHandler callback to be invoked when error is encountered
 */
export async function getGithubTpls (errHandler?: ErrorHandler, proxyStr?: string): Promise<Template[]> {
  const proxy = parseHttpsProxy(proxyStr)
  return await getTpls(providers.github, 'Github', errHandler, proxy)
}

/**
 * List repo directories inside the Github metadata repo
 * @param errHandler callback to be invoked when error is encountered
 */
export async function getGiteeTpls (errHandler?: ErrorHandler): Promise<Template[]> {
  return await getTpls(providers.gitee, 'Gitee', errHandler)
}

/**
 * List repo directories inside the `templates` metadata repository
 * @param errHandler
 */
async function getTpls (
  apiUrl: string,
  source: TemplateSource,
  errHandler?: ErrorHandler,
  proxy?: AxiosProxyConfig
): Promise<Template[]> {
  try {
    const response = await axios(apiUrl, { proxy })
    const repoFetches = response.data
      .filter((item: any) => item && item.type === 'dir')
      .map((item: any) => getTplsInfo(item.url, item.name, source, proxy))
    return Promise.all(repoFetches)
  } catch (err) {
    errHandler && errHandler(err)
    return []
  }
}

/**
 * Request github repository API and retrieve detailed repo infomation
 * @param templateId template repo directory name the metadata repo
 * @param templateUrl template github repository, i.e.
 *  https://api.github.com/repos/edgeros/templates/contents/tpl-standard?ref=main
 */
async function getTplsInfo (templateUrl: string, templateId: string, source: TemplateSource, proxy?: AxiosProxyConfig): Promise<Template> {
  const conventionalFiles: { [key: string]: any } = {
    'desc.json': undefined,
    'banner.png': undefined
  }
  const conventialFileNames = new Set(Object.keys(conventionalFiles))

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

  const descJson = conventionalFiles['desc.json'] as TemplateConf
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
    }
  }
  return { ...descJson, id: templateId, source, gitUrl }
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
