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
import { EdgerosProjectConfig, Template } from '../types'

export async function loadPkgJson (projectPath: string, templateInfo?: Template) {
  return loadJson(packagePath(projectPath, templateInfo))
}

export async function loadEosJson (projectPath: string, templateInfo?: Template) {
  return loadJson(edgerosPath(projectPath, templateInfo))
}

export async function applyProjectConfig (projectPath: string, config: EdgerosProjectConfig, templateInfo?: Template) {
  const packageFile = packagePath(projectPath, templateInfo)
  const edgerosFile = edgerosPath(projectPath, templateInfo)

  const [packageJson, edgerosJson] = await Promise.all([
    loadPkgJson(projectPath, templateInfo),
    loadEosJson(projectPath, templateInfo)
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

function packagePath (projectPath: string, templateInfo?: Template) {
  if (templateInfo && templateInfo.root) {
    return fs.join(projectPath, templateInfo.root, 'package.json')
  } else {
    return fs.join(projectPath, 'package.json')
  }
}

function edgerosPath (projectPath: string, templateInfo?: Template) {
  if (templateInfo && templateInfo.root) {
    return fs.join(projectPath, templateInfo.root, 'edgeros.json')
  } else {
    return fs.join(projectPath, 'edgeros.json')
  }
}
