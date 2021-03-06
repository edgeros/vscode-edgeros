/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author       : Fu Wenhao <fuwenhao@acoinfo.com>
 * Date         : 2021-09-23 11:02:42
 * LastEditors  : Fu Wenhao <fuwenhao@acoinfo.com>
 * LastEditTime : 2021-10-08 17:02:53
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import * as gulp from 'gulp'
import * as ts from 'gulp-typescript'

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
          const tsProject = ts.createProject(path.join(projectPath, 'tsconfig.json'))
          tsProject.src().pipe(tsProject()).js.pipe(gulp.dest(path.join(projectPath, tsProject.rawConfig?.compilerOptions?.outDir || 'dist')))
          resolve()
        })
      })
  }
}

export default tsCompile
