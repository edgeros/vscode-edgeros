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
import { appendLine } from '../components/output'
import * as gulp from 'gulp'
import * as ts from 'gulp-typescript'

/**
 *  Custom reporter
 */
const customReporter = ts.reporter.defaultReporter()
customReporter.error = (error: ts.reporter.TypeScriptError) => {
  const outputStr = error.message.replace(new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|'), 'gim'), '')
  appendLine(outputStr)
}

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
      (progress, token) => {
        return new Promise<void>((resolve, reject) => {
          progress.report({ message: 'runing...' })
          const tsProject = ts.createProject(path.join(projectPath, 'tsconfig.json'), {
            // noImplicitAny: true,
            noEmitOnError: true
          })
          const gulpStream = gulp.dest(path.join(projectPath, tsProject.rawConfig?.compilerOptions?.outDir || 'dist'))
          const tsCompileStream = tsProject.src().pipe(tsProject(customReporter))
          tsCompileStream.on('error', (err) => { reject(err) })
          gulpStream.on('finish', () => { resolve() })
          tsCompileStream.js.pipe(gulpStream)
        })
      })
  }
}

export default tsCompile
