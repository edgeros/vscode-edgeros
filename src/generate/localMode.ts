/*
 * @Author: FuWenHao
 * @Date: 2021-04-17 16:10:07
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-01 15:32:11
 */
import * as path from 'path'
import { fileURLToPath } from 'url'
import { copyProject, replaceInfo } from './util'
import { assertNotFile } from '../utility/simpleFs'

/**
 * local temaple, new project
 * @param tplInfo
 * @param options
 */
export default async function localMode (tplInfo: any, options: any): Promise<string> {
  try {
    const newProjectPath = path.join(options.savePath, options.name)
    const tplPath = fileURLToPath(tplInfo.downloadUrl)
    await assertNotFile(newProjectPath)
    await copyProject(tplPath, newProjectPath)
    await replaceInfo(newProjectPath, options)
    return newProjectPath
  } catch (err) {
    console.log('local template new project error:', err)
    throw err
  }
}
