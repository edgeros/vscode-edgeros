/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : gitClient.test.ts
 */

import * as os from 'os'
import * as path from 'path'
import * as assert from 'assert'
import * as rimraf from 'rimraf'
import { promisify } from 'util'
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

  it.skip('gitClone github https url', function (cb) {
    this.timeout(10000) // this could be slow
    gitClone('https://github.com/edgeros/templates.git')
      .then(dir => {
        const tmpdir = os.tmpdir()
        assert(dir.startsWith(tmpdir), 'clone to system temp dir')
        return assertFile(path.join(dir, 'README.md'))
          .finally(() => promisify(rimraf)(dir))
      })
  })

  it('gitClone gitee https url', function (cb) {
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
