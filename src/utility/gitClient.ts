/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : gitClient.js
 * Desc   : simple git client based on isomorphic-git
 */

import * as os from 'os'
import * as path from 'path'
import * as crypto from 'crypto'
import * as fs from 'fs'

import * as http from 'isomorphic-git/http/node'
import * as git from 'isomorphic-git'
import base64url from 'base64url'

import { TemplateCloneOptions } from '../model'

export function gitClone (url: string, opts?: TemplateCloneOptions): Promise<string> {
  if (!url) {
    return Promise.reject(Error('URL should not be empty'))
  }

  return new Promise((resolve, reject) => {
    const {
      depth = 1,
      dir: tmpdir = tmpdirName(),
      onProgress = (event: git.GitProgressEvent) => {
        if (event.total) {
          console.log('gitClient clone %s: %d/%d', event.phase, event.loaded, event.total)
        } else {
          console.log('gitClient clone %s: %d', event.phase, event.loaded)
        }
      }
    } = opts || {}

    const onAuthFailure: git.AuthFailureCallback = (url, auth) => {
      reject(Error(`auth failed with ${auth}: ${url}`))
    }

    git.clone({ fs, http, url, depth, dir: tmpdir, onProgress, onAuthFailure })
      .then(() => resolve(tmpdir))
  })

  function tmpdirName () {
    return path.join(os.tmpdir(), randomFileName())
  }
}

/**
 * Generate random file name via base64url, from which, all the chars are compatible in
 *   URL and Windows, Linux file system.
 * @param {string} prefix of the generated file name
 * @param {number } randomBytes should be multiples of 3
 */
export function randomFileName (prefix = 'vscode-edgeros.tpl.', randomBytes = 9) {
  const bytes = crypto.randomBytes(randomBytes)
  return prefix + base64url.encode(bytes) // 9 / 3 * 4 = 12 chars
}
