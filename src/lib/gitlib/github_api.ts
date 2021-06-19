import axios from 'axios'
import * as moment from 'moment'
import { sendEdgerOSOutPut } from '../common'

const tplsUrl = 'https://api.github.com/repos/edgeros/templates/contents/'
/**
*获取模板详细信息
*/
async function getTplsInfo (item: any) {
  try {
    const dirFile = await axios({
      url: item.url,
      method: 'get'
    })
    const bannerImg = dirFile.data.find((item: any) => {
      return item.name === 'banner.png'
    })
    // 检查 banner.png
    if (!bannerImg) {
      throw new Error('not found banner.png')
    }
    const descJson = dirFile.data.find((item: any) => {
      return item.name === 'desc.json'
    })
    // 检查 desc.json
    if (!descJson) {
      throw new Error('not found desc.json')
    }
    const descJsonRes = await axios({
      url: descJson.download_url,
      method: 'get'
    })

    let gitUrl = null
    if (typeof descJsonRes.data.repository === 'string') {
      gitUrl = descJsonRes.data.repository
    } else if (typeof descJsonRes.data.repository === 'object') {
      const gitrepos = descJsonRes.data.repository
      gitUrl = gitrepos.github
      if (!gitUrl) {
        gitUrl = gitrepos[Object.keys(gitrepos)[0]]
      }
    } else {
      throw new Error('desc.json not found in gitUrl')
    }

    return {
      tempName: descJsonRes.data.name,
      description: descJsonRes.data.description,
      icon: bannerImg.download_url,
      gitUrl: gitUrl,
      downloadUrl: gitUrl,
      type: descJsonRes.data.type,
      location: 'cloud'
    }
  } catch (error) {
    sendEdgerOSOutPut(`
    =================create project time:${moment().format()} =================
    host: ${error.config.baseURL}
    path:${error.config.url}
    message:${error.message}
    response:${error.response ? JSON.stringify({ status: error.response.status, data: error.response.data }) : error.response}
    `)
    return null
  }
}
/**
*获取模板列表
*/
async function getTpls () {
  try {
    const reposList = await axios({
      url: tplsUrl,
      method: 'get'
    })
    // 获取模板列表
    const tplsDir: any[] = []
    reposList.data.forEach((item: any) => {
      if (item.type === 'dir') {
        tplsDir.push({
          name: item.name,
          url: item.url
        })
      }
    })
    // 获取模板信息
    const tplInfoFun: any[] = []
    tplsDir.forEach(item => {
      tplInfoFun.push(getTplsInfo(item))
    })

    const tplInfos = await Promise.all(tplInfoFun)
    return tplInfos.filter(item => {
      return !!item
    })
  } catch (error) {
    sendEdgerOSOutPut(`
    =================create project time:${moment().format()} =================
    host: ${error.config.baseURL}
    path:${error.config.url}
    message:${error.message}
    response:${error.response ? JSON.stringify({ status: error.response.status, data: error.response.data }) : error.response}
    `)
    return []
  }
}

export async function getGithubTpls (): Promise<any[] | []> {
  const tpls = await getTpls()
  return tpls
}
