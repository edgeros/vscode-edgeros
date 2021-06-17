/*
 * @Author: FuWenHao  
 * @Date: 2021-04-19 10:20:53 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-06-08 19:38:59
 */
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { sendEdgerOSOutPut } from '../lib/common';
import { copyProject, replaceInfo, deleteFile } from './util';

import * as path from "path";
import * as fs from "fs-extra";
import * as http from "isomorphic-git/http/node";
import * as git from 'isomorphic-git';
import httpClient from '../lib/httpClient';
import * as compressing from "compressing";

/**
 * cloud download template, new project
 * @param tplInfo 
 * @param options 
 */
export default async function cloudMode(tplInfo: any, options: any): Promise<string> {
  try {
    let newProPath = path.join(options.savePath, options.name);
    if (fs.existsSync(newProPath)) { throw new Error('The project file already exists') };
    let fileInfo: any;
    // 模板信息
    fileInfo = await gitClone(tplInfo);

    await copyProject(fileInfo.sourceDirPath, newProPath);
    await deleteFile([fileInfo.zipFile, fileInfo.fileTmpPath]);
    await replaceInfo(newProPath, options);
    return newProPath;
  } catch (err) {
    sendEdgerOSOutPut("EdgerOS Plugin:" + err.message);
    console.log("cloud template new project error:", err.message);
    throw err;
  }
}

/**
 * 调用GIT 获取模板信息
 */
function gitClone(tplInfo: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    let fileTmpPath = path.join(__dirname, './tmp');
    let cloneFileName = 'gitClone';

    if (fs.existsSync(fileTmpPath)) {
      fs.removeSync(fileTmpPath)
    }
    const dir = path.join(fileTmpPath, cloneFileName)
    await git.clone({ fs, http, dir, url: tplInfo.downloadUrl })
    if (fs.existsSync(path.join(fileTmpPath, cloneFileName))) {
      resolve({
        fileTmpPath: fileTmpPath,
        sourceDirPath: path.join(fileTmpPath, cloneFileName)
      });
    } else {
      reject(new Error('git clone: Unknown error occurred'));
    }
  })
}

