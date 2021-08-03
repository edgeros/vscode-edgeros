/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : simpleFs.ts
 * Desc   : file system utility based on fs-extra
 */

import * as fs from 'fs-extra'

// eslint-disable-next-line node/no-deprecated-api
export * from 'path'
export * from 'fs-extra'

/**
 * Resolve if the filepath is accessible
 */
export function assertExist (filepath: string): Promise<string> {
  return filepath
    ? fs.access(filepath).then(() => filepath)
    : Promise.reject(ErrorEmptyFilepath())
}

/**
 * Reject if the filepath is accessible
 */
export function assertNotExist (filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!filepath) return reject(ErrorEmptyFilepath())
    fs.access(filepath, err => {
      if (err && err.code === 'ENOENT') {
        return resolve(filepath)
      }
      reject(ErrorAlreadyExist(filepath))
    })
  })
}

function ErrorEmptyFilepath () {
  return Error('Empty filepath!')
}

function ErrorAlreadyExist (filepath: string) {
  return Error(`Filepath should not exist: ${filepath}`)
}
