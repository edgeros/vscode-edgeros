import * as fs from 'fs-extra'
import * as path from 'path'

/**
 * copy file
 */
export function copyProject (sourcePath: string, savePath: string) {
  return fs.copy(sourcePath, savePath)
}

/**
 * replaceInfo
 */

export async function replaceInfo (savePath: string, options: any) {
  const edgerospath = path.join(savePath, 'edgeros.json')
  if (!fs.existsSync(edgerospath)) throw new Error('edgeros.json not found:' + edgerospath)
  const edgerosStr = require(edgerospath)
  edgerosStr.name = options.name
  edgerosStr.bundleid = options.bundleid
  edgerosStr.vendor.id = options.vendorId
  edgerosStr.vendor.name = options.vendorName
  edgerosStr.vendor.email = options.vendorEmail
  edgerosStr.vendor.phone = options.vendorPhone
  edgerosStr.vendor.fax = options.vendorFax
  fs.writeFileSync(edgerospath, JSON.stringify(edgerosStr, null, 4), { encoding: 'utf-8' })

  const pkgpath = path.join(savePath, 'package.json')
  if (!fs.existsSync(pkgpath)) throw new Error('package.json not found')
  const pkgJStr = require(pkgpath)
  pkgJStr.name = options.bundleid
  pkgJStr.version = options.version
  pkgJStr.description = options.description

  // package.json author is vendor
  // if (true) {
  // pkgJStr.author = {
  //   id: edgerosStr.vendor.id || undefined,
  //   name: edgerosStr.vendor.name || undefined,
  //   email: edgerosStr.vendor.email || undefined,
  //   phone: edgerosStr.vendor.phone || undefined,
  //   fax: edgerosStr.vendor.fax || undefined,
  // };
  pkgJStr.author = edgerosStr.vendor.email
  fs.writeFileSync(pkgpath, JSON.stringify(pkgJStr, null, 4), { encoding: 'utf-8' })
  // }
}

/**
 * 删除没目录及文件
 * @param {*} pathList
 * @returns
 */
export async function deleteFile (pathList: string[]) {
  for (const filePath of pathList) {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true })
      } else {
        fs.unlinkSync(filePath)
      }
    }
  }
  return Promise.resolve('success')
}
