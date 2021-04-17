/*
 * @Author: FuWenHao  
 * @Date: 2021-04-17 16:10:07 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-17 17:15:10
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

export default async function (tplInfo: any, options: any) {
  try {
    let savePath = options.savePath;
    let name = options.name;
    let newProPath = path.join(savePath, name);
    let tplPath = path.join(__dirname, '../../templates/simple_tpl');
    let capyRes = await copyProject(tplPath, newProPath);
    await replaceInfo(newProPath, options);

    let newProUri = vscode.Uri.file(newProPath);
    let success = await vscode.commands.executeCommand(
      'vscode.openFolder',
      newProUri
    );
  } catch (err) {
    console.log(err);
  }
}

/**
 * copy file
 */
function copyProject(sourcePath: string, savePath: string) {
  return fs.copy(sourcePath, savePath);
}

/**
 * replaceInfo
 */

async function replaceInfo(savePath: string, options: any) {
  let edgerospath = path.join(savePath, 'edgeros.json');
  if (!fs.existsSync(edgerospath)) throw new Error("edgeros.json not found");
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
    pkgJStr.author = {
      id: edgerosStr.vendor.id || undefined,
      name: edgerosStr.vendor.name || undefined,
      email: edgerosStr.vendor.email || undefined,
      phone: edgerosStr.vendor.phone || undefined,
      fax: edgerosStr.vendor.fax || undefined,
    };
    fs.writeFileSync(pkgpath, JSON.stringify(pkgJStr, null, 4), { encoding: 'utf-8' });
  }
}
