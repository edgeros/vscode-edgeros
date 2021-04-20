import * as compressing from 'compressing';
import * as stream from 'stream';
import * as  util from 'util';
const pipeline = util.promisify(stream.pipeline);
import * as path from "path";
import * as fs from "fs-extra";
import * as globby from "globby";
import { copyProject, replaceInfo, deleteFile } from './util';
import * as vscode from 'vscode';

//hard code modules filter name list
var blackModslist: string[] = [];

// User Select modules filter
var userFilterMods: any[] = [];

// file or folder filter name list
var blacklistFile: string[] = [];

/** 
      * @param {*} sBasePath 项目 nodemodels地址 
      * @param {*} mods nodemodels 中含有的文件数组
      * @param {*} jsreMpath 要保存到的文件地址
      */
async function copy_module(sBasePath: string, mods: string[], jsreMpath: string) {
  for (let i = 0; i < mods.length; i++) {
    let modulesPath = path.join(sBasePath, mods[i]);
    let fileStat = fs.statSync(modulesPath);
    if (!fileStat.isDirectory()) {
      continue
    }
    let files = fs.readdirSync(modulesPath);
    let pkg = files.find(item => {
      return item === 'package.json';
    })
    if (pkg) {
      let pkgData = require(path.join(modulesPath, 'package.json'));
      /**
       * 过滤包
       */
      if (pkgData.name.search(/@edgeros\/.*/g) != -1 && blackModslist.indexOf(pkgData.name) == -1) {
        let filterStatus = true;
        let filterPackage = userFilterMods.find((item) => {
          return item == pkgData.name
        })
        if (filterPackage) {
          filterStatus = false;
        } else {
          filterStatus = true;
        }
        if (filterStatus) {
          await copyProject(modulesPath, path.join(jsreMpath, mods[i]));
        } else {
          console.log("[EdgerOS Cli]:", 'filter', "user filter package ->", pkgData.name)
        }
      } else {
        console.log("[EdgerOS Cli]:", 'info', "auto filter package ->", pkgData.name)
      }
    } else {
      /**
       * 过滤文件夹
       */
      let nextMods = fs.readdirSync(modulesPath);
      let nextJsreMpath = path.join(jsreMpath, mods[i]);
      fs.mkdirSync(nextJsreMpath);
      await copy_module(modulesPath, nextMods, nextJsreMpath)
    }
  }

  // 若文件夹为空则删除
  let dirArrylist = fs.readdirSync(jsreMpath);
  if (dirArrylist.length == 0) {
    await deleteFile([jsreMpath]);
  }
}

/**
 * 构建项目包
 */
export default async function buildEap(workspacePath: string, options: any): Promise<string> {
  // info filter module
  blackModslist = [
    '@edgeros/vue'
  ];
  userFilterMods = []
  blacklistFile = [
    "**",
    "!.git",
    "!jsconfig.json",
    "!package-lock.json",
    "!package.json",
    "!edgeros.json",
    "!node_modules",
    "!*.eap",
    "!*.zip"
  ];

  return await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Building EAP",
    cancellable: false
  }, async (progress, token) => {
    try {

      progress.report({ increment: 10, message: "build common file" });
      let projectPath = workspacePath;
      let eosAndpkgJson = getEosAndPkgJson(projectPath);
      userFilterMods = eosAndpkgJson.eos.ignore_modules || [];
      if (eosAndpkgJson.eos.ignore_path && eosAndpkgJson.eos.ignore_path.length > 0) {
        eosAndpkgJson.eos.ignore_path.forEach((path: string) => {
          blacklistFile.push('!' + path);
        })
      }
      const projectFileList = await globby(blacklistFile, {
        cwd: projectPath
      });
      let buildFileTmp = path.join(__dirname, "./build_tmp");
      if (fs.existsSync(buildFileTmp)) await deleteFile([buildFileTmp]);
      // 普通文件复制
      for (let i = 0; i < projectFileList.length; i++) {
        let copyFilePath = projectFileList[i];
        let targetFilePath = path.join(buildFileTmp, 'program', copyFilePath);
        await copyProject(path.join(projectPath, copyFilePath), targetFilePath);
      }

      // node_modules -> jsre_modules
      progress.report({ increment: 10, message: "node_modules build jsre_modules" });
      if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
        let jsreMpath = path.join(buildFileTmp, 'program', 'jsre_modules');
        fs.mkdirSync(jsreMpath);
        let sBasePath = path.join(projectPath, 'node_modules');
        let mods = fs.readdirSync(sBasePath);
        await copy_module(sBasePath, mods, jsreMpath)
      }

      // 将 ico 文件复制到根目录;
      progress.report({ increment: 10, message: "Adjusting file structure" });
      let icoBigName = eosAndpkgJson.eos.assets.ico_big.split('/').pop();
      let icoSmallName = eosAndpkgJson.eos.assets.ico_small.split('/').pop();
      fs.renameSync(path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_big), path.join(buildFileTmp, icoBigName));
      fs.renameSync(path.join(buildFileTmp, 'program', eosAndpkgJson.eos.assets.ico_small), path.join(buildFileTmp, icoSmallName));
      createDesc(buildFileTmp, eosAndpkgJson);

      // 压缩
      progress.report({ increment: 50, message: "compressing..." });
      let eapName = path.join(projectPath, eosAndpkgJson.pkg.name + '_' + eosAndpkgJson.pkg.version + '.eap');//.zip
      let tarStream = new compressing.zip.Stream();
      fs.readdirSync(buildFileTmp).forEach(item => {
        tarStream.addEntry(path.join(buildFileTmp, item))
      })
      let destStream = fs.createWriteStream(eapName);
      let ctime = new Date();
      await pipeline(tarStream, destStream);
      console.log("buildTime/ms:", (new Date()).getTime() - ctime.getTime());
      // delete tmp file
      progress.report({ increment: 10, message: "delete tmp file" });
      await deleteFile([buildFileTmp]);
      // upload config file
      progress.report({ increment: 10, message: "upload config file" });
      updataJsonFile(projectPath, eosAndpkgJson, options);
      progress.report({ increment: 10, message: "build success" });

      return new Promise<string>(resolve => {
        setTimeout(() => {
          resolve(eapName);
        }, 500);
      });
    } catch (err) {
      console.log("[EdgerOS Cli]:", 'info' + err);
      return '';
    }
  })


}


/**
 * updata json file and version
 * @param {*} projectPath 
 */
function updataJsonFile(projectPath: string, eosAndpkgJson: any, options: any) {
  // version add 1 nIncrease : no increase version
  if (!options.nIncrease) {
    let arryVer = eosAndpkgJson.pkg.version.split('.');
    arryVer[2] = Number(arryVer[2]) + 1;
    eosAndpkgJson.pkg.version = arryVer.join('.');
  }
  // user select block modules update;
  eosAndpkgJson.eos.ignore_modules = userFilterMods.length > 0 ? userFilterMods : [];
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(eosAndpkgJson.pkg, null, 4))
  fs.writeFileSync(path.join(projectPath, 'edgeros.json'), JSON.stringify(eosAndpkgJson.eos, null, 4))
}

/**
 * 获取edgeros 配置信息
 */
function getEosAndPkgJson(projectPath: string) {
  // version add 1
  let pkgPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgPath)) throw new Error("package.json not found");
  delete require.cache[require.resolve(pkgPath)];
  let pkgJson = require(pkgPath);

  let eosJsonPath = path.join(projectPath, 'edgeros.json');
  if (!fs.existsSync(eosJsonPath)) throw new Error("edgeros.json not found");
  delete require.cache[require.resolve(eosJsonPath)];
  let eosJson = require(eosJsonPath);

  return {
    pkg: pkgJson,
    eos: eosJson
  };
}


/**
 * 生成desc.json 文件
 */

function createDesc(buildFileTmp: string, eosAndpkgJson: any) {
  let descpath = path.join(buildFileTmp, 'desc.json');
  let descData: any = {};
  descData.id = eosAndpkgJson.eos.bundleid;
  descData.name = eosAndpkgJson.pkg.name;
  descData.ico = {
    big: eosAndpkgJson.eos.assets.ico_big.split('/').pop(),
    small: eosAndpkgJson.eos.assets.ico_small.split('/').pop(),
  };
  descData.program = { ...eosAndpkgJson.eos.program };
  descData.program.main = eosAndpkgJson.pkg.main;
  descData.program.splash = eosAndpkgJson.eos.assets.splash;
  descData.program.mesv = eosAndpkgJson.eos.program.mesv.split('.').map((item: string) => Number(item));
  descData.program.release = (new Date()).getTime();
  descData.program.version = eosAndpkgJson.pkg.version.split('.').map((item: string) => Number(item));
  descData.vendor = {
    id: eosAndpkgJson.eos.vendor.id,
    name: eosAndpkgJson.eos.vendor.name,
    email: eosAndpkgJson.eos.vendor.email,
    phone: eosAndpkgJson.eos.vendor.phone,
    fax: eosAndpkgJson.eos.vendor.fax,
  }

  fs.writeFileSync(descpath, JSON.stringify(descData, null, 4));
}