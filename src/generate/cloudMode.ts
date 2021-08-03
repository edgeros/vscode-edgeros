/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : cloudMode.ts
 * Desc   : clone from remote template repository
 */

import { EdgerosProjectConfig, GitProgressCallback, Template } from '../types'
import * as fs from '../utility/simpleFs'
import { gitClone } from '../utility/gitClient'
import { applyProjectConfig } from './jsonHandler'

export default async function cloudMode (
  template: Template,
  config: EdgerosProjectConfig,
  onProgress?: GitProgressCallback)
: Promise<string> {
  const normalizedName = config.name.replace(' ', '-')
  const newProjectPath = fs.join(config.savePath, normalizedName)

  await fs.assertNotExist(newProjectPath)
  await gitClone(template.gitUrl, { directory: newProjectPath, onProgress })
  await applyProjectConfig(newProjectPath, config)

  return newProjectPath
}
