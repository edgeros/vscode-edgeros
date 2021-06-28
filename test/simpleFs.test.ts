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
import { assertFile, assertNotFile } from '../src/utility/simpleFs'

describe('Simple FS wrapper', function () {
  it('assert file', function (cb) {
    assertFile('this/file/never/exist')
      .catch(() => assertFile(__filename))
      .then(filename => {
        assert.strictEqual(__filename, filename)
        cb()
      })
  })

  it('assert not exist file', function () {
    return assertNotFile(__filename)
      .catch(() => assertNotFile('this/file/never/exist'))
      .then(filename => {
        assert.strictEqual(filename, 'this/file/never/exist')
      })
  })
})
