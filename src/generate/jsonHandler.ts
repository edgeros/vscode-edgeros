/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : common.ts
 * Desc   : re-usable tasks
 */

import * as fs from '../utility/simpleFs'
import { EdgerosProjectConfig } from '../types'

export async function loadPkgJson (projectPath: string) {
  return loadJson(packagePath(projectPath))
}

export async function loadEosJson (projectPath: string) {
  return loadJson(edgerosPath(projectPath))
}

export async function applyProjectConfig (projectPath: string, config: EdgerosProjectConfig) {
  const packageFile = packagePath(projectPath)
  const edgerosFile = edgerosPath(projectPath)

  const [packageJson, edgerosJson] = await Promise.all([
    loadPkgJson(projectPath),
    loadEosJson(projectPath)
  ])

  edgerosJson.name = config.name
  edgerosJson.bundleid = config.bundleId
  edgerosJson.vendor.id = config.vendorId
  edgerosJson.vendor.name = config.vendorName
  edgerosJson.vendor.email = config.vendorEmail
  edgerosJson.vendor.phone = config.vendorPhone
  edgerosJson.vendor.fax = config.vendorFax

  packageJson.name = config.bundleId
  packageJson.version = config.version
  packageJson.description = config.description
  packageJson.author = config.vendorEmail

  return Promise.all([
    fs.writeFile(edgerosFile, JSON.stringify(edgerosJson, null, 4), { encoding: 'utf-8' }),
    fs.writeFile(packageFile, JSON.stringify(packageJson, null, 4), { encoding: 'utf-8' })
  ])
}

async function loadJson (filepath: string) {
  await fs.assertExist(filepath)
  const buff = await fs.readFile(filepath)
  return JSON.parse(buff.toString())
}

function packagePath (projectPath: string) {
  return fs.join(projectPath, 'package.json')
}

function edgerosPath (projectPath: string) {
  return fs.join(projectPath, 'edgeros.json')
}
