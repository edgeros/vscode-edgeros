/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : simpleFs.test.ts
 */

import * as assert from 'assert'
import { assertExist, assertNotExist } from '../src/utility/simpleFs'

describe('Simple FS wrapper', function () {
  it('assert file', function (cb) {
    assertExist('this/file/never/exist')
      .catch(() => assertExist(__filename))
      .then(filename => {
        assert.strictEqual(__filename, filename)
        cb()
      })
  })

  it('assert not exist file', function (cb) {
    assertNotExist(__filename)
      .then(() => assertNotExist('this/file/never/exist'))
      .then(
        () => cb(Error('should not call')),
        () => cb(null)
      )
  })
})
