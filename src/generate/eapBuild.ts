import * as compressing from 'compressing'
import * as stream from 'stream'
import * as util from 'util'
import * as path from 'path'
import * as fs from 'fs'
import * as globby from 'globby'
import { copyProject, deleteFile } from './util'
import * as vscode from 'vscode'
import * as jschardet from 'jschardet'
const pipeline = util.promisify(stream.pipeline)
const readdir = util.promisify(fs.readdir)

// hard code modules filter name list
let blackModslist: string[] = []

// User Select modules filter
let userFilterMods: any[] = []

// file or folder filter name list
let blacklistFile: string[] = []

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
export default async function buildEap (workspacePath: string, options: any): Promise<string> {
  // info filter module
  blackModslist = [
    '@edgeros/vue'
  ]
  userFilterMods = []
  blacklistFile = [
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

  const eapPathUrl: string = await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Building EdgerOS App',
    cancellable: false
  }, async (progress, token) => {
    progress.report({ message: 'build common file' })
    const projectPath = workspacePath
    const eosAndpkgJson = getEosAndPkgJson(projectPath)
    userFilterMods = eosAndpkgJson.eos.ignore_modules || []

    // 文件名UTF-8检查
    await dirNameU8(projectPath)

    // 过滤文件
    if (eosAndpkgJson.eos.ignore_path && eosAndpkgJson.eos.ignore_path.length > 0) {
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

    if (fs.existsSync(buildFileTmp)) await deleteFile([buildFileTmp])
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
      await copyProject(sourceFilePath, targetFilePath)
    }

    // node_modules -> jsre_modules
    progress.report({ message: 'node_modules build jsre_modules' })
    if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
      const jsreMpath = path.join(buildFileTmp, 'program', 'jsre_modules')
      fs.mkdirSync(jsreMpath)
      const sBasePath = path.join(projectPath, 'node_modules')
      const mods = fs.readdirSync(sBasePath)
      await copyModule(sBasePath, mods, jsreMpath)
    }

    // 将 ico 文件复制到根目录;
    progress.report({ message: 'Adjusting file structure' })
    const icoBigName = eosAndpkgJson.eos.assets.ico_big.split('/').pop()
    const icoSmallName = eosAndpkgJson.eos.assets.ico_small.split('/').pop()
    fs.renameSync(path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_big), path.join(buildFileTmp, icoBigName))
    fs.renameSync(path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_small), path.join(buildFileTmp, icoSmallName))
    if (eosAndpkgJson.eos.widget) {
      eosAndpkgJson.eos.widget.forEach((item: any) => {
        const assetWidgetIcon = expandAssetsMacro(item.ico, eosAndpkgJson.eos.assets)
        if (assetWidgetIcon) {
          const assetPath = path.join(buildFileTmp, 'program', assetWidgetIcon)
          if (fs.existsSync(assetPath)) {
            const widgetIcon = path.basename(assetWidgetIcon)
            fs.renameSync(assetPath, path.join(buildFileTmp, widgetIcon))
            item.ico = widgetIcon
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
    const eapName = path.join(projectPath, 'temp', eosAndpkgJson.pkg.name + '_' + eosAndpkgJson.pkg.version + (options.buildType !== 'test' ? '' : '_test') + ('.' + (options.configInfo?.buildSuffix ? options.configInfo?.buildSuffix : 'eap')))// .zip
    const tarStream = new compressing.zip.Stream()
    fs.readdirSync(buildFileTmp).forEach(item => {
      tarStream.addEntry(path.join(buildFileTmp, item))
    })
    const destStream = fs.createWriteStream(eapName)
    await pipeline(tarStream, destStream)
    // delete tmp file
    progress.report({ message: 'delete tmp file' })
    await deleteFile([buildFileTmp])
    // upload config file
    progress.report({ message: 'upload config file' })
    updataJsonFile(projectPath, eosAndpkgJson, options)
    progress.report({ message: 'build success' })

    return new Promise<string>(resolve => {
      setTimeout(() => {
        resolve(eapName)
      }, 500)
    })
  })

  return eapPathUrl
}

/**
* @param {*} sBasePath 项目 nodemodels地址
* @param {*} mods nodemodels 中含有的文件数组
* @param {*} jsreMpath 要保存到的文件地址
*/
async function copyModule (sBasePath: string, mods: string[], jsreMpath: string) {
  for (let i = 0; i < mods.length; i++) {
    const modulesPath = path.join(sBasePath, mods[i])
    const fileStat = fs.statSync(modulesPath)
    if (!fileStat.isDirectory()) {
      continue
    }
    const files = fs.readdirSync(modulesPath)
    const pkg = files.find(item => {
      return item === 'package.json'
    })
    if (pkg) {
      const pkgData = require(path.join(modulesPath, 'package.json'))
      /**
       * 过滤包
       */
      if (pkgData.name.search(/@edgeros\/.*/g) !== -1 && blackModslist.indexOf(pkgData.name) === -1) {
        const filterPackage = userFilterMods.find((item) => {
          return item === pkgData.name
        })
        if (!filterPackage) {
          await copyProject(modulesPath, path.join(jsreMpath, mods[i]))
          chickIndex(jsreMpath, mods[i])
        } else {
          // console.log("[EdgerOS Cli]:", 'filter', "user filter package ->", pkgData.name)
        }
      } else {
        // console.log("[EdgerOS Cli]:", 'info', "auto filter package ->", pkgData.name)
      }
    } else {
      /**
       * 过滤文件夹
       */
      const nextMods = fs.readdirSync(modulesPath)
      const nextJsreMpath = path.join(jsreMpath, mods[i])
      fs.mkdirSync(nextJsreMpath)
      await copyModule(modulesPath, nextMods, nextJsreMpath)
    }
  }

  // 若文件夹为空则删除
  const dirArrylist = fs.readdirSync(jsreMpath)
  if (dirArrylist.length === 0) {
    await deleteFile([jsreMpath])
  }
}

/**
 * updata json file and version
 * @param {*} projectPath
 */
function updataJsonFile (projectPath: string, eosAndpkgJson: any, options: any) {
  // version add 1 nIncrease : no increase version
  if (options.buildType !== 'test' && options.configInfo?.increment) {
    const arryVer = eosAndpkgJson.pkg.version.split('.')
    arryVer[2] = Number(arryVer[2]) + 1
    eosAndpkgJson.pkg.version = arryVer.join('.')
  }
  // user select block modules update;
  eosAndpkgJson.eos.ignore_modules = userFilterMods.length > 0 ? userFilterMods : []
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(eosAndpkgJson.pkg, null, 4))
  fs.writeFileSync(path.join(projectPath, 'edgeros.json'), JSON.stringify(eosAndpkgJson.eos, null, 4))
}

/**
 * 获取edgeros 配置信息
 */
function getEosAndPkgJson (projectPath: string) {
  // version add 1
  const pkgPath = path.join(projectPath, 'package.json')
  if (!fs.existsSync(pkgPath)) throw new Error('package.json not found')
  delete require.cache[require.resolve(pkgPath)]
  const pkgJson = require(pkgPath)

  const eosJsonPath = path.join(projectPath, 'edgeros.json')
  if (!fs.existsSync(eosJsonPath)) throw new Error('edgeros.json not found')
  delete require.cache[require.resolve(eosJsonPath)]
  const eosJson = require(eosJsonPath)

  return {
    pkg: pkgJson,
    eos: eosJson
  }
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
  // 构建正式与测试类型  测试启动路径为 egeros.json test入口，正式启动路径为 package.json main入口
  descData.program.main = eosAndpkgJson.pkg.main
  if (options.buildType === 'test') {
    descData.program.main = createRunTestFile(eosAndpkgJson.eos.test, path.join(buildFileTmp, 'program'))
  }

  descData.program.splash = eosAndpkgJson.eos.assets.splash
  descData.program.mesv = eosAndpkgJson.eos.program.mesv.split('.').map((item: string) => Number(item))
  descData.program.release = (new Date()).getTime()
  descData.program.version = eosAndpkgJson.pkg.version.split('.').map((item: string) => Number(item))

  if (eosAndpkgJson.eos.loading) {
    descData.loading = Object.assign({}, eosAndpkgJson.eos.loading)
    const assetSplash = expandAssetsMacro(descData.loading.splash, eosAndpkgJson.eos.assets)
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
    eosAndpkgJson.eos.widget.forEach((item: any) => {
      const tmpWidget = { ...item }
      // tmpWidget.ico = eosAndpkgJson.eos.assets[tmpWidget.ico].split('/').pop()
      descData.widget.push(tmpWidget)
    })
  }
  fs.writeFileSync(descpath, JSON.stringify(descData, null, 4))
}

/**
 * 文件名UTF-8检查
 * @param dirPath
 */
async function dirNameU8 (dirPath: string) {
  const fileArray: any[] | undefined = await readdir(dirPath, {
    encoding: 'buffer',
    withFileTypes: true
  })

  for (let i = 0; i < fileArray.length; i++) {
    if (fileArray[i].name.toString() === 'node_modules') {
      continue
    }
    const detectData = jschardet.detect(fileArray[i].name)
    if (detectData.encoding !== 'ascii' && detectData.encoding !== 'UTF-8') {
      throw new Error('The file name encoding format is UTF-8:\n' + path.join(dirPath, fileArray[i].name.toString()))
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
function chickIndex (jsreMpath: any, modeName: string) {
  const tmpPath = path.join(jsreMpath, modeName, 'index.js')
  if (!fs.existsSync(tmpPath)) {
    const pkgJson: any = JSON.parse(fs.readFileSync(path.join(jsreMpath, modeName, 'package.json'), { encoding: 'utf-8' }))
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

function expandAssetsMacro (assetsRef: string, assets: any): string | undefined {
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
  const fileName = 'testApp' + (new Date()).getTime() + '.js'
  const templeStr = `require('${testPath.replace('.js', '')}');`
  fs.writeFileSync(path.join(savePath, fileName), templeStr)
  return fileName
}
