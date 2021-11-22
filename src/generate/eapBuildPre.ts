/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * 此文件为 eapBuild 打包前置处理
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2021-11-17 15:04:01
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2021-11-22 16:10:52
 */
import { nlsConfig } from '../nls'
import * as path from 'path'
import * as fs from 'fs-extra'
import imgSize from 'image-size'
import { Validator } from 'jsonschema'

const jsonSchema = require('../../resources/edgeros.en.schema.json')
const localize = nlsConfig(__filename)

interface EapAndPkgJson {
  pkg: any;
  eos: any;
}

interface Assets {
  [assetsKey: string]: string
}

/**
 * 项目打包前，项目校验入口
 * @param projectPath 项目的根路径
 * @param eosAndpkgJson edgeros.json 与 package.json的集合
 */
export function eapBuildVerify (projectPath: string, eosAndpkgJson: EapAndPkgJson) {
  icoVerify(projectPath, eosAndpkgJson.eos.assets)
  edgerosJsonVerify(eosAndpkgJson.eos)
}

/**
 * edgeros.json 格式校验
 * @param eos edgeros.json 对象
 */
function edgerosJsonVerify (eos: any) {
  const v = new Validator()
  if (!v.validate(eos, jsonSchema).valid) {
    throw new Error('edgeros.json incorrect format')
  }
}

/**
 * 校验资源对象
 * @param projectPath 项目的根路径
 * @param assets 资源对象
 */
function icoVerify (projectPath: string, assets: Assets) {
  for (const icoKey in assets) {
    const icoPath: string = path.join(projectPath, assets[icoKey])
    if (!fs.existsSync(icoPath)) {
      throw new Error(`${localize('noFindFile.txt', 'file does not exist')}:${icoPath}`)
    }
    // ico_big ico_small
    if (icoKey === 'ico_big' || icoKey === 'ico_small') {
      const imgFormat = ['png', 'jpg', 'jpeg']
      const fileStat = fs.statSync(icoPath)
      // 1024*100 不能大于100kb
      if (fileStat.size > 102400) {
        throw new Error(`${icoKey} ${localize('imageMaximum.txt', 'images cannot exceed')} 100kb : ${icoPath}`)
      }
      const icoDimensions = imgSize(icoPath)
      if (!icoDimensions.height || !icoDimensions.width || !icoDimensions.type) {
        throw new Error(`${localize('imageParsingFailure', 'Image parsing failure')}:${icoPath}`)
      }

      if (icoKey === 'ico_small') {
        if (!((icoDimensions.height <= 180) && (icoDimensions.width <= 180))) {
          throw new Error(`${icoKey} ${localize('imageSizeLess.txt', 'image should be less than')} 180 * 180`)
        }
      }

      if (icoKey === 'ico_big') {
        if (!((icoDimensions.height <= 240) && (icoDimensions.width <= 240))) {
          throw new Error(`${icoKey} ${localize('imageSizeLess.txt', 'image should be less than')} 240 * 240`)
        }
      }

      if (imgFormat.indexOf(icoDimensions.type) === -1) {
        throw new Error(`${icoKey} ${localize('imageFormat.txt', ' image format is')}: ${imgFormat.join(',')}`)
      }
    }

    // splash
    if (icoKey === 'splash') {
      const imgFormat = ['png', 'jpg', 'jpeg', 'gif']
      const fileStat = fs.statSync(icoPath)
      // 1024*2048 不能大于2048kb
      if (fileStat.size > 2097152) {
        throw new Error(`${icoKey} ${localize('imageMaximum.txt', 'images cannot exceed')} 2MB : ${icoPath}`)
      }
      const icoDimensions = imgSize(icoPath)
      if (!icoDimensions.height || !icoDimensions.width || !icoDimensions.type) {
        throw new Error(`${localize('imageParsingFailure', 'Image parsing failure')}:${icoPath}`)
      }
      // splash 只迟滞 png jpg jpeg gif格式
      if (imgFormat.indexOf(icoDimensions.type) === -1) {
        throw new Error(`${icoKey} ${localize('imageFormat.txt', ' image format is')}: ${imgFormat.join(',')}`)
      }
    }
  }
}
