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

// re-export path function so the client code does not have to import again
// eslint-disable-next-line node/no-deprecated-api
export * from 'path'
export * from 'fs-extra'

export class SimpleFsError extends Error {
  private origin: Error | undefined
  constructor (message: string, origin?: Error) {
    super(message)
    this.origin = origin
  }

  static ErrorEmptyFilepath () {
    return new SimpleFsError('SimpeFs - empty filepath!')
  }

  static ErrorNotExist (filepath: string, origin?: Error) {
    return new SimpleFsError(`SimpleFs - filepath should exist: ${filepath}`, origin)
  }

  static ErrorAlreadyExist (filepath: string) {
    return new SimpleFsError(`SimpleFs - filepath should not exist: ${filepath}`)
  }
}

/**
 * Resolve if the filepath is accessible
 */
export function assertExist (filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!filepath) {
      return reject(SimpleFsError.ErrorEmptyFilepath())
    }
    fs.access(filepath).then(
      () => resolve(filepath),
      err => reject(SimpleFsError.ErrorNotExist(filepath, err))
    )
  })
}

/**
 * Reject if the filepath is accessible
 */
export function assertNotExist (filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!filepath) {
      return reject(SimpleFsError.ErrorEmptyFilepath())
    }
    fs.access(filepath, err => {
      if (err && err.code === 'ENOENT') {
        return resolve(filepath)
      }
      reject(SimpleFsError.ErrorAlreadyExist(filepath))
    })
  })
}
