/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : edgeros.ts
 * Desc   : module to interop with EdgerOS device
 */

import * as fs from 'fs'
import { edgerosIdePort } from '../config'
import httpClient from './httpClient'
import * as FormData from 'form-data'

/**
 * 上传eap文件至网关
 * @param eapPath
 * @param devIp
 * @param devPwd
 */
export async function uploadEap (eapPath: string, devIp: string, devPwd: string) {
  const form = new FormData()
  form.append('eap', fs.createReadStream(eapPath))
  const uploadApiConfig = {
    baseURL: `http://${devIp}:${edgerosIdePort}`,
    auth: {
      username: 'edger',
      password: devPwd
    },
    headers: form.getHeaders()
  }
  return httpClient
    .post('/upload', form, uploadApiConfig)
    .then(function (response) {
      return `Upload completed. ${eapPath}`
    })
}

/**
 * 在设备中安装已上传的eap
 * @param eapName
 * @param devIp
 * @param devPwd
 * @returns
 */

export async function installEap (eapName: string, devIp: string, devPwd: string) {
  const installApiConfig = {
    baseURL: `http://${devIp}:${edgerosIdePort}`,
    auth: {
      username: 'edger',
      password: devPwd
    }
  }
  return httpClient
    .post('/install', { eap: eapName }, installApiConfig)
    .then(function (response) {
      return `Installation completed: ${eapName}`
    })
}
