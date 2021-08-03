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
import * as fs from 'fs-extra'
import { gitClone, randomFileName } from '../src/utility/gitClient'

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
        return fs.pathExists(path.join(dir, 'README.md'))
          .then(exists => {
            assert(exists, 'README should exist!')
          })
          .finally(() => fs.remove(dir))
      })
  })

  it('gitClone gitee https url', function (cb) {
    const cloneDir = path.join(__dirname, 'testClone')

    gitClone('https://gitee.com/edgeros/templates.git', { directory: cloneDir })
      .then(dir => {
        assert.strictEqual(dir, cloneDir, 'clone success')
        return fs.pathExists(path.join(dir, 'README.md'))
      })
      .then(exists => assert(exists, 'README should exist'))
      .finally(() => {
        fs.remove(cloneDir, cb)
      })
  })
})
