/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : simpleFs.ts
 * Desc   : file system utilies
 */

import { promises as fs } from 'fs'
import { NodeSystemError } from '../types'

/**
 * Assert file existence and resolve with the given path
 */
export function assertFile (filePath: string): Promise<string> {
  if (!filePath) {
    return Promise.reject(Error('File path cannot be empty'))
  }
  return filePath
    ? fs.access(filePath).then(() => filePath)
    : Promise.reject(Error('Empty filePath'))
}

/**
 * Assert file NOT exist and resolve with the given path
 */
export function assertNotFile (filePath: string): Promise<string> {
  return assertFile(filePath)
    .then(
      () => Promise.reject(Error(`File already exist: ${filePath}`)),
      (err: NodeSystemError) => {
        if (err.code === 'ENOENT') {
          return Promise.resolve(filePath)
        }
        return Promise.reject(err)
      }
    )
}
