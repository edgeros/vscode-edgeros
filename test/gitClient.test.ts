/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : gitClient.test.ts
 */

import * as rimraf from 'rimraf'
import * as path from 'path'
import * as assert from 'assert'
import { gitClone, randomFileName } from '../src/utility/gitClient'
import { assertFile } from '../src/utility/simpleFs'

describe('Git client', function () {
  it('generate ramdom filename with default prefix', function () {
    assert(randomFileName().startsWith('vscode-edgeros.tpl'))
  })

  it('gitClone throws on empty url', function () {
    return gitClone('').catch(err => {
      assert(err)
    })
  })

  it('gitClone https url', function (cb) {
    this.timeout(5000) // this could be slow
    const cloneDir = path.join(__dirname, 'testClone')

    gitClone('https://gitee.com/edgeros/templates.git', { dir: cloneDir })
      .then(dir => {
        assert.strictEqual(dir, cloneDir, 'clone success')
        return assertFile(path.join(dir, 'README.md'))
      })
      .finally(() => {
        rimraf(cloneDir, cb)
      })
  })
})
