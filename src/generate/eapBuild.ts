/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : eapBuild.ts
 * Desc   : Bundle current project into EdgerOS app package
 */

import * as path from 'path'
import * as stream from 'stream'
import * as globby from 'globby'
import * as vscode from 'vscode'
import * as compressing from 'compressing'
import tsCompile from './tsCompile'
import { promisify } from 'util'
import { eapBuildVerify } from './eapBuildPre'
import * as fs from '../utility/simpleFs'
// import { copyProject, deleteFile } from './util'
import { loadEosJson, loadPkgJson, loadJson } from './jsonHandler'

const pipeline = promisify(stream.pipeline)

interface CopyModuleOptions {
  /** 复制时需要排除的包 */
  excludeMods?: Set<string>
  /** 复制时需要包含的包 */
  includeMods?: Set<string>
}

/**
 * 构建项目包
 * option:{
 *  configInfo:{
 *        buildSuffix:    // 生成文件后缀  eap/zip
 *        increment:      // 版本是否自增
 *  }
 * buildType:   //构建类型  test:从ergeros.json中的test入口启动程序, production:从 package.json中main入口启动程序
 * }
 */
export default async function buildEap (
  projectPath: string,
  options: any
): Promise<string> {
  const eosAndpkgJson = await getEosAndPkgJson(projectPath)

  // eap build pre verify
  eapBuildVerify(projectPath, eosAndpkgJson)

  // default file / folder list to be ignored
  const blacklistFile = [
    '**',
    '!.git',
    '!jsconfig.json',
    '!package-lock.json',
    '!package.json',
    '!edgeros.json',
    '!node_modules',
    '!*.eap',
    '!*.zip'
  ]

  // User Select modules filter
  const userFilterMods = (eosAndpkgJson.eos.ignore_modules || []) as string[]

  const userJsNativeMods = (eosAndpkgJson.eos.native_modules || []) as string[]

  // typescript project judgment to compile
  await tsCompile(projectPath)

  // eap build
  const eapPathUrl: string = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Building EdgerOS App',
      cancellable: false
    },
    async (progress, token) => {
      progress.report({ message: 'build common file' })

      // 文件名UTF-8检查
      await dirNameU8(projectPath)

      // 过滤文件
      if (
        eosAndpkgJson.eos.ignore_path &&
        eosAndpkgJson.eos.ignore_path.length > 0
      ) {
        eosAndpkgJson.eos.ignore_path.forEach((path: string) => {
          blacklistFile.push('!' + path)
        })
      }
      // 正式环境打包主动忽略test文件夹
      if (options.buildType !== 'test') {
        blacklistFile.push('!test')
      }
      const projectFileList = await globby(blacklistFile, {
        cwd: projectPath
      })
      const buildFileTmp = path.join(__dirname, './build_tmp')
      await fs.remove(buildFileTmp)

      // 普通文件复制
      for (let i = 0; i < projectFileList.length; i++) {
        const copyFilePath = projectFileList[i]
        const targetFilePath = path.join(buildFileTmp, 'program', copyFilePath)
        const sourceFilePath = path.join(projectPath, copyFilePath)
        // // 校验文件内容编码utf-8
        // if (/(\.html|\.css|\.js|\.json)$/i.test(sourceFilePath)) {
        //   let detectData = jschardet.detect(fs.readFileSync(sourceFilePath));
        //   if (detectData.encoding !== 'ascii' && detectData.encoding !== 'UTF-8') {
        //     throw new Error('The encoding format is UTF-8:\n' + sourceFilePath);
        //   }
        // }
        await fs.copy(sourceFilePath, targetFilePath)
      }

      // node_modules -> jsre_modules
      progress.report({ message: 'node_modules build jsre_modules' })
      if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
        const jsreModPath = path.join(buildFileTmp, 'program', 'jsre_modules')
        fs.mkdirSync(jsreModPath)
        const sBasePath = path.join(projectPath, 'node_modules')

        const excludeMods = new Set(userFilterMods)
        const includeMods = new Set(userJsNativeMods)
        await copyModule(sBasePath, jsreModPath, { excludeMods, includeMods })
      }

      // 将 ico 文件复制到根目录;
      progress.report({ message: 'Adjusting file structure' })
      const icoBigName = eosAndpkgJson.eos.assets.ico_big.split('/').pop()
      const icoSmallName = eosAndpkgJson.eos.assets.ico_small.split('/').pop()
      fs.renameSync(
        path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_big),
        path.join(buildFileTmp, icoBigName)
      )
      fs.renameSync(
        path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_small),
        path.join(buildFileTmp, icoSmallName)
      )
      if (eosAndpkgJson.eos.widget) {
        eosAndpkgJson.eos.widget.forEach((item: any) => {
          const assetWidgetIcon = expandAssetsMacro(
            item.ico,
            eosAndpkgJson.eos.assets
          )
          if (assetWidgetIcon) {
            const assetPath = path.join(
              buildFileTmp,
              'program',
              assetWidgetIcon
            )
            if (fs.existsSync(assetPath)) {
              const widgetIcon = path.basename(assetWidgetIcon)
              fs.renameSync(assetPath, path.join(buildFileTmp, widgetIcon))
            }
          }
        })
      }
      //  生成desc.json
      createDesc(buildFileTmp, eosAndpkgJson, options)

      // 压缩
      progress.report({ message: 'compressing...' })
      if (!fs.existsSync(path.join(projectPath, 'temp'))) {
        fs.mkdirSync(path.join(projectPath, 'temp'))
      }
      const eapName = path.join(
        projectPath,
        'temp',
        eosAndpkgJson.pkg.name +
        '_' +
        eosAndpkgJson.pkg.version +
        (options.buildType !== 'test' ? '' : '_test') +
        ('.' +
          (options.configInfo?.buildSuffix
            ? options.configInfo?.buildSuffix
            : 'eap'))
      ) // .zip
      const tarStream = new compressing.zip.Stream()
      fs.readdirSync(buildFileTmp).forEach(item => {
        tarStream.addEntry(path.join(buildFileTmp, item))
      })
      const destStream = fs.createWriteStream(eapName)

      await pipeline(tarStream, destStream)
      // delete tmp file
      progress.report({ message: 'delete tmp file' })

      await fs.remove(buildFileTmp)

      // upload config file
      progress.report({ message: 'upload config file' })
      updataJsonFile(projectPath, eosAndpkgJson, options, userFilterMods)
      progress.report({ message: 'build success' })

      return new Promise<string>(resolve => {
        setTimeout(() => {
          resolve(eapName)
        }, 500)
      })
    }
  )

  return eapPathUrl
}

/**
 * @param {*} srcBasePath 项目 nodemodels 地址
 * @param {*} dstBasePath 要保存到的文件地址
 * @param {*} opts Copy options
 */
async function copyModule (srcBasePath: string, dstBasePath: string, opts: CopyModuleOptions = {}): Promise<void> {
  const { excludeMods = new Set<string>(), includeMods = new Set<string>() } = opts

  const modFolderNames = await fs.readdir(srcBasePath)
  for (const modFolder of modFolderNames) {
    const modulesPath = path.join(srcBasePath, modFolder)
    const fileStat = await fs.stat(modulesPath)
    if (!fileStat.isDirectory()) continue

    const files = await fs.readdir(modulesPath)
    const isJsPkgFolder = files.find(item => item === 'package.json')

    if (isJsPkgFolder) {
      const { name: pkgName } = await loadJson<{ name: string }>(path.join(modulesPath, 'package.json'))

      if (excludeMods.has(pkgName)) continue // 黑名单过滤

      if (!includeMods.has(pkgName) && pkgName.search(/@edgeros\/.*/g) === -1) continue // 过滤不在白名单中且不属于 EdgerOS 的包

      await fs.copy(modulesPath, path.join(dstBasePath, modFolder))
      generateIndex(dstBasePath, modFolder)
    } else { // 文件夹
      const nextJsreMpath = path.join(dstBasePath, modFolder)
      await fs.mkdir(nextJsreMpath)
      await copyModule(modulesPath, nextJsreMpath, opts)
    }
  }

  // 若文件夹为空则删除
  const dirArrylist = await fs.readdir(dstBasePath)
  if (dirArrylist.length === 0) await fs.remove(dstBasePath)
}

/**
 * updata json file and version
 * @param {*} projectPath
 */
function updataJsonFile (
  projectPath: string,
  eosAndpkgJson: any,
  options: any,
  userFilterMods: string[]
) {
  // version add 1 nIncrease : no increase version
  if (options.buildType !== 'test' && options.configInfo?.versionIncrement) {
    const arryVer = eosAndpkgJson.pkg.version.split('.')
    arryVer[2] = Number(arryVer[2]) + 1
    eosAndpkgJson.pkg.version = arryVer.join('.')
  }
  // user select block modules update;
  eosAndpkgJson.eos.ignore_modules =
    userFilterMods.length > 0 ? userFilterMods : []
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(eosAndpkgJson.pkg, null, 4)
  )
  fs.writeFileSync(
    path.join(projectPath, 'edgeros.json'),
    JSON.stringify(eosAndpkgJson.eos, null, 4)
  )
}

/**
 * Load package.json and edgeros.json
 */
async function getEosAndPkgJson (projectPath: string) {
  const [pkg, eos] = await Promise.all([
    loadPkgJson(projectPath),
    loadEosJson(projectPath)
  ])
  return { pkg, eos }
}

/**
 * 生成desc.json 文件
 */

function createDesc (buildFileTmp: string, eosAndpkgJson: any, options: any) {
  const descpath = path.join(buildFileTmp, 'desc.json')
  const descData: any = {}
  descData.id = eosAndpkgJson.eos.bundleid || eosAndpkgJson.pkg.name
  descData.name = eosAndpkgJson.eos.name || eosAndpkgJson.pkg.name
  if (options.buildType === 'test') {
    descData.name = '_test_' + descData.name
  }
  descData.ico = {
    big: eosAndpkgJson.eos.assets.ico_big.split('/').pop(),
    small: eosAndpkgJson.eos.assets.ico_small.split('/').pop()
  }
  descData.program = { ...eosAndpkgJson.eos.program }
  descData.program.resource = descData.program.resource ? eosAndpkgJson.eos.program.resource : 'public'
  // 构建正式与测试类型  测试启动路径为 egeros.json test入口，正式启动路径为 package.json main入口
  descData.program.main = eosAndpkgJson.pkg.main
  if (options.buildType === 'test') {
    descData.program.main = createRunTestFile(
      eosAndpkgJson.eos.test,
      path.join(buildFileTmp, 'program')
    )
  }

  // Backward compatiblity for EdgerOS <= 1.5.5, which requires the splash field
  descData.program.splash = eosAndpkgJson.eos.assets.splash

  descData.program.mesv = eosAndpkgJson.eos.program.mesv
    .split('.')
    .map((item: string) => Number(item))
  descData.program.release = new Date().getTime()
  descData.program.version = eosAndpkgJson.pkg.version
    .split('.')
    .map((item: string) => Number(item))

  if (eosAndpkgJson.eos.loading) {
    descData.loading = Object.assign({}, eosAndpkgJson.eos.loading)
    const assetSplash = expandAssetsMacro(
      descData.loading.splash,
      eosAndpkgJson.eos.assets
    )
    if (assetSplash) {
      descData.program.splash = assetSplash // deprecated splash setting
      descData.loading.splash = assetSplash // up coming, but not ready yet
    }
  }

  descData.vendor = {
    id: eosAndpkgJson.eos.vendor.id,
    name: eosAndpkgJson.eos.vendor.name,
    email: eosAndpkgJson.eos.vendor.email,
    phone: eosAndpkgJson.eos.vendor.phone,
    fax: eosAndpkgJson.eos.vendor.fax
  }
  descData.update = eosAndpkgJson.eos.update
  if (eosAndpkgJson.eos.widget) {
    descData.widget = []
    for (const item of eosAndpkgJson.eos.widget || []) {
      const tmpWidget = { ...item }
      const widgetFile = eosAndpkgJson.eos.assets[tmpWidget.ico]
      if (widgetFile) {
        tmpWidget.ico = path.basename(eosAndpkgJson.eos.assets[tmpWidget.ico])
        descData.widget.push(tmpWidget)
      } else {
        throw Error(`Cannot find ico in assets: ${tmpWidget.ico}`)
      }
    }
  }
  fs.writeFileSync(descpath, JSON.stringify(descData, null, 4))
}

/**
 * 文件名UTF-8检查
 * @param dirPath
 */
async function dirNameU8 (dirPath: string) {
  const fileArray: any[] | undefined = await fs.readdir(dirPath, {
    encoding: 'buffer',
    withFileTypes: true
  })

  for (let i = 0; i < fileArray.length; i++) {
    if (fileArray[i].name.toString() === 'node_modules') {
      continue
    }

    if (fileArray[i].isDirectory()) {
      await dirNameU8(path.join(dirPath, fileArray[i].name.toString()))
    }
  }
}

/**
 * 检查模块 index文件是否存在。
 * 不存在index文件自动生成
 * @param jsreMpath
 * @param modeName
 */
function generateIndex (jsreMpath: any, modeName: string) {
  const tmpPath = path.join(jsreMpath, modeName, 'index.js')
  if (!fs.existsSync(tmpPath)) {
    const pkgJson: any = JSON.parse(
      fs.readFileSync(path.join(jsreMpath, modeName, 'package.json'), {
        encoding: 'utf-8'
      })
    )
    if (pkgJson.main) {
      const indexPath: string = path.join(jsreMpath, modeName, 'index.js')
      const reqStr = `//build automatic generation index.js
let main = require("./${pkgJson.main}");
module.exports=main;
`
      fs.writeFileSync(indexPath, reqStr)
    } else {
      throw new Error(`Module [ ${modeName} ] package.json not main`)
    }
  } else {
    // console.log("存在", tmpPath)
  }
}

function expandAssetsMacro (
  assetsRef: string,
  assets: any
): string | undefined {
  const macroPrefix = '$assets.'
  if (assetsRef.startsWith(macroPrefix)) {
    return assets[assetsRef.substring(macroPrefix.length)]
  } else if (Object.prototype.hasOwnProperty.call(assets, assetsRef)) {
    return assets[assetsRef]
  }
}
/**
 * 生成 test入口文件
 */
function createRunTestFile (testPath: string, savePath: string) {
  const fileName = 'testApp' + new Date().getTime() + '.js'
  const templeStr = `require('${testPath.replace('.js', '')}');`
  fs.writeFileSync(path.join(savePath, fileName), templeStr)
  return fileName
}
