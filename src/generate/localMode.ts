/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : localMode.ts
 * Desc   : clone from local builtin template repository
 */
import { fileURLToPath } from 'url'
import { applyProjectConfig } from './jsonHandler'
import * as fs from '../utility/simpleFs'
import * as path from 'path'

/**
 * local temaple, new project
 * @param tplInfo
 * @param options
 */
export default async function localMode (tplInfo: any, options: any): Promise<string> {
  const newProjectPath = fs.join(options.savePath, options.name)
  const templatePath = fileURLToPath(tplInfo.downloadUrl)
  await fs.assertNotExist(newProjectPath)
  await fs.copy(templatePath, newProjectPath)
  await applyProjectConfig(newProjectPath, options)
  fs.removeSync(path.join(newProjectPath, '.git'))

  return newProjectPath
}
