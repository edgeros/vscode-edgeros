import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * copy file
 */
export function copyProject(sourcePath: string, savePath: string) {
  return fs.copy(sourcePath, savePath);
}

/**
 * replaceInfo
 */

export async function replaceInfo(savePath: string, options: any) {
  let edgerospath = path.join(savePath, 'edgeros.json');
  if (!fs.existsSync(edgerospath)) throw new Error("edgeros.json not found:" + edgerospath);
  let edgerosStr = require(edgerospath);
  edgerosStr.bundleid = options.bundleid;
  edgerosStr.vendor.id = options.vendorId;
  edgerosStr.vendor.name = options.vendorName;
  edgerosStr.vendor.email = options.vendorEmail;
  edgerosStr.vendor.phone = options.vendorPhone;
  edgerosStr.vendor.fax = options.vendorFax;
  fs.writeFileSync(edgerospath, JSON.stringify(edgerosStr, null, 4), { encoding: 'utf-8' });



  let pkgpath = path.join(savePath, 'package.json');
  if (!fs.existsSync(pkgpath)) throw new Error("package.json not found");
  let pkgJStr = require(pkgpath);
  pkgJStr.name = options.name;
  pkgJStr.version = options.version;
  pkgJStr.description = options.description;

  // package.json author is vendor
  if (true) {
    let authtmp: any = {
      id: edgerosStr.vendor.id || undefined,
      name: edgerosStr.vendor.name || undefined,
      email: edgerosStr.vendor.email || undefined,
      phone: edgerosStr.vendor.phone || undefined,
      fax: edgerosStr.vendor.fax || undefined,
    };

    for (let key in authtmp) {
      if (authtmp[key] !== undefined) {
        pkgJStr.author = authtmp
        break;
      }
    }
    fs.writeFileSync(pkgpath, JSON.stringify(pkgJStr, null, 4), { encoding: 'utf-8' });
  }
}


/**
 * 删除没目录及文件
 * @param {*} pathList 
 * @returns 
 */
export function deleteFile(pathList: string[]) {
  return new Promise(async (resolve) => {
    for (let i = 0; i < pathList.length; i++) {
      let filePath = pathList[i];
      if (fs.existsSync(filePath)) {
        let stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
    resolve('success');
  })
}
