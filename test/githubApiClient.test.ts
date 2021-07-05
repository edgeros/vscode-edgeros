/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : githubClient.test.ts
 * Desc   : githubClient unit tests
 */

import { getGithubTpls, getGiteeTpls } from '../src/utility/githubApiClient'

describe('Github Client tests', function () {
  this.timeout(10000) // this could be slow

  it('get github templates', function () {
    return getGithubTpls()
  })

  it('get gitee templates', () => {
    return getGiteeTpls()
  })
})
