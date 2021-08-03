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

import * as fs from 'fs-extra'
import * as http from 'isomorphic-git/http/node'
import * as git from 'isomorphic-git'
import base64url from 'base64url'

import { assertExist } from './simpleFs'
import { TemplateCloneOptions } from '../types'

export function gitClone (url: string, opts?: TemplateCloneOptions): Promise<string> {
  if (!url) {
    return Promise.reject(Error('URL should not be empty'))
  }

  return new Promise((resolve, reject) => {
    const {
      depth = 1,
      reinit = true,
      directory: tmpdir = tmpdirName()
    } = opts || {}

    const progressCb = opts?.onProgress || function noop () {}
    const onProgress = (event: git.GitProgressEvent) => {
      if (opts?.onProgress) {
        if (event.total) {
          progressCb(`gitClient clone ${event.phase}: ${event.loaded}/${event.total}`)
        } else {
          progressCb(`gitClient clone ${event.phase}: ${event.loaded}`)
        }
      }
    }

    const onAuthFailure: git.AuthFailureCallback = (url, auth) => {
      reject(Error(`auth failed with ${auth}: ${url}`))
    }

    git.clone({ fs, http, url, depth, dir: tmpdir, onProgress, onAuthFailure })
      .then(() => gitInit(tmpdir, reinit))
      .then(() => resolve(tmpdir), err => reject(err))
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

function gitInit (dir: string, reinit = true, defaultBranch = 'master', gitdir = '.git'): Promise<string> {
  const gitdirPath = path.join(dir, gitdir)
  if (reinit) {
    return new Promise((resolve, reject) => {
      fs.remove(gitdirPath, err => {
        if (err) return reject(err)
        resolve(gitdirPath)
      })
    })
      .then(() => git.init({ fs, dir, gitdir: gitdirPath, defaultBranch }))
      .then(() => dir)
  } else {
    return assertExist(gitdirPath)
  }
}
