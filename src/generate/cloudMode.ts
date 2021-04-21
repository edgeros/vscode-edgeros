/*
 * @Author: FuWenHao  
 * @Date: 2021-04-19 10:20:53 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-21 10:13:02
 */
import * as vscode from 'vscode';
import { copyProject, replaceInfo, deleteFile } from './util';

import * as path from "path";
import * as fs from "fs-extra";
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

    let fileInfo = await downZip(tplInfo);
    await copyProject(fileInfo.sourceDirPath, newProPath);
    await deleteFile([fileInfo.zipFile, fileInfo.fileTmpPath]);
    await replaceInfo(newProPath, options);
    return newProPath;
  } catch (err) {
    console.log("cloud template new project error:", err);
    throw err;
  }
}



/**
 * 下载文档并解压
 * @param {} sateInfo 
 * @returns 
 */
function downZip(tplInfo: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // 下载数据包
    let zipPath = path.join(__dirname, './tmp.zip');
    let fileTmpPath = path.join(__dirname, './tmp');
    let zipStream = fs.createWriteStream(zipPath);
    let downData = null;

    try {
      downData = await httpClient.get(tplInfo.downloadUrl, {
        responseType: 'stream'
      })
    } catch (err) {
      reject(err);
      return
    }

    let downFileName = "";
    let contentDisposition = downData.headers['content-disposition'] || '';
    if (contentDisposition) {
      let fileName = contentDisposition.split('filename=');
      //  fileName = contentDisposition.split("filename*=UTF-8''");
      if (fileName && fileName.length) {
        let refFn = fileName[1].split('.');
        downFileName = refFn[0].replace("\"", "");
      } else {
        throw new Error('无法解析文件名称:filename')
      }
    }

    zipStream.on('finish', async () => {
      // 解压
      await compressing.zip.uncompress(zipPath, fileTmpPath);
      resolve({
        zipFile: zipPath,
        fileTmpPath: fileTmpPath,
        sourceDirPath: path.join(fileTmpPath, downFileName)
      });
    })
    zipStream.on('error', async (err) => {
      console.log("文件下载报错")
      reject(err);
    })
    await downData.data.pipe(zipStream);
  })
}