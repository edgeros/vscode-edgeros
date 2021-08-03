import * as assert from 'assert'
import { Template } from '../src/types'
import { getLocalTemplates, getRemoteTemplates } from '../src/generate/templateProvider'

describe('templateProvider', function () {
  it('getLocalTemplates', () => {
    return getLocalTemplates()
      .then(templates => {
        assert(templates, 'successfully')
        const simpleTemplate = templates[0] as Template
        assert.strictEqual(simpleTemplate.name, 'Local')
      })
  })

  it('getRemoteTemplates from gitee', function () {
    return getRemoteTemplates('Gitee')
      .then(templates => {
        assert(templates, 'successfully')
      })
  })

  it('getRemoteTemplates from github', function () {
    if (!process.env.https_proxy) this.skip()
    this.timeout(10000)
    return getRemoteTemplates('Github')
      .then(templates => {
        assert(templates, 'successfully')
      })
  })
})
