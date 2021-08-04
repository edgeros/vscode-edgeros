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
import { SimpleFsError, assertExist, assertNotExist } from '../src/utility/simpleFs'

const fileNeverExist = 'this/file/never/exist'

describe('Simple FS wrapper', function () {
  it('assertExist existing file', function () {
    return assertExist(__filename)
      .then(filename => {
        assert.strictEqual(__filename, filename)
      })
  })

  it('assertExist non existing file', function () {
    return assertExist(fileNeverExist)
      .catch(err => {
        assert(err instanceof SimpleFsError)
      })
  })

  it('assertNotExist existing file', function () {
    return assertNotExist(__filename)
      .catch(err => {
        assert(err instanceof SimpleFsError)
      })
  })

  it('assertNotExist non existing file', function () {
    return assertNotExist(fileNeverExist)
  })
})
