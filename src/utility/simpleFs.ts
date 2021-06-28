import { promises as fs } from 'fs'
import { NodeSystemError } from '../model'

/**
 * Assert file already exist
 */
export function assertFile (filePath: string) {
  return filePath
    ? fs.access(filePath).then(() => filePath)
    : Promise.reject(Error('Empty filePath'))
}

/**
 * Assert file NOT exist
 */
export function assertNotFile (filePath: string) {
  return assertFile(filePath)
    .then(
      () => Promise.reject(Error(`File already exist: ${filePath}`)),
      (err: NodeSystemError) => {
        if (err.code === 'ENOENT') {
          return Promise.resolve(filePath)
        }
        return Promise.reject(err)
      }
    )
}
