/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : common.ts
 * Desc   : re-usable tasks
 */

import * as path from 'path'
import { promises as fsPromise } from 'fs'
import { assertFile } from '../utility/simpleFs'

export async function loadPkgJson (projectPath: string) {
  return loadJson(path.join(projectPath, 'package.json'))
}

export async function loadEosJson (projectPath: string) {
  return loadJson(path.join(projectPath, 'edgeros.json'))
}

async function loadJson (filepath: string) {
  await assertFile(filepath)
  const buff = await fsPromise.readFile(filepath)
  return JSON.parse(buff.toString())
}
