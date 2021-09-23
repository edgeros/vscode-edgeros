/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2021-09-23 11:02:42
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2021-09-23 14:06:58
 */
import * as fs from 'fs'
import { spawn } from 'child_process'
import * as path from 'path'
import * as vscode from 'vscode'

export async function tsCompile (projectPath: string): Promise<void> {
  const files: string[] = fs.readdirSync(projectPath)
  const tsSta = files.findIndex((item: string) => {
    return item === 'tsconfig.json'
  })
  if (tsSta !== -1) {
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Compile TypeScript EdgerOS App',
        cancellable: false
      },
      async (progress, token) => {
        return new Promise<void>((resolve, reject) => {
          progress.report({ message: 'runing...' })
          const npx = spawn('npx ', ['tsc', '-p', projectPath], {
            cwd: path.join(__dirname, '../../'),
            shell: true
          })
          npx.stdout.on('data', (data) => {
            console.log(`npx tsc stdout: ${data}`)
          })

          npx.stderr.on('data', (data) => {
            console.error(`npx tsc stderr: ${data}`)
          })

          npx.on('close', (code) => {
            console.log(`npx tsc close: ${code}`)
            resolve()
          })
        })
      })
  }
}

export default tsCompile
