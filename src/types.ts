/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : model.ts
 * Desc   : types and models
 */

import type * as vscode from 'vscode'
import type { URL } from 'url'

export type NodeSystemError = NodeJS.ErrnoException
export type ErrorHandler = (err: Error) => {}

export interface TemplateRepoConfig {
  readonly github?: URL; // github repo
  readonly gitee?: URL; // gitee repo
  readonly local?: URL; // local file system repo (builtin template)
}

export interface TemplateConfig {
  readonly name: string; // display name
  readonly banner: string; // url or base64 png
  readonly description: string; // short brief
  readonly 'description_zh-cn'?: string;
  readonly type: string;
  readonly root?: string;
  readonly repository: TemplateRepoConfig;
}

export interface TemplateViewItem {
  name: string; // descJsonRes.data.name,
  description: string; // descJsonRes.data.description,
  banner: string; // bannerImg.download_url,
  gitUrl: string; // gitUrl,
  downloadUrl: string; // gitUrl,
  type: string; // descJsonRes.data.type,
  location: string // 'cloud'
  root?: string
}

export interface TemplateType {
  readonly 'type': string; // template type
  readonly 'label': string;
  readonly 'label_zh-cn'?: string;
  readonly 'description': string;
  readonly 'description_zh-cn'?: string;
}

export interface TemplateTypeViewItem {
  type: string; // 模板类型
  label: string; // 页面显示标题
  desc: string; // 模板类型描述
}

export type TemplateSource = 'Local' | 'Github' | 'Gitee'

export interface BuildInfo {
  selectBuild: string | null,
  projectPaths: string[]
}
/**
 * Concrete TemplateConf instance:
 *  - identified by template folder name
 *  - repository object is merged into a single source `gitUrl` field
 */
export interface Template extends Omit<TemplateConfig, 'repository'> {
  readonly id: string;
  readonly source: TemplateSource;
  readonly gitUrl: string;
}

export interface TemplateInfo {
  readonly typeArray: TemplateType[];
  readonly tempArray: Template[];
}

export type GitProgressCallback = (msg: string) => void

export interface TemplateCloneOptions {
  depth?: number; // clone depth, default to 1
  directory?: string; // clone target
  reinit?: boolean; // cleanup git history of the clone
  onProgress?: GitProgressCallback;
}

export interface EdgerosProjectConfig { // web form
  name: string;
  bundleId: string;
  description?: string;
  savePath: string;
  version: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  vendorFax?: string;
  vendorPhone?: string;
}

export interface EdgerosDevice { // web form
  readonly devId: string, // auto generate
  devIp: string,
  devName: string,
  devPwd: string
}

export interface EdgerosConsoleOptions {
  timeout?: number, // connect timeout
  retries?: number, // times to retry on connection error
  retryInterval?: number // retry timer interval
}

export interface WorkspaceSettings {
  versionIncrement: boolean;
  buildSuffix: 'eap' | 'zip';
  installEAP: 'Auto' | 'Manual';
  templateSource: TemplateSource;
}

export interface GithubFileResponse {
  name: string; // 'LICENSE'
  path: string; // 'LICENSE'
  url: string; // https://api.github.com/repos/edgeros/templates/contents/LICENSE?ref=main
  // eslint-disable-next-line camelcase
  download_url: string; // https://raw.githubusercontent.com/edgeros/templates/main/LICENSE
  // eslint-disable-next-line camelcase
  git_url: string; // 'https://api.github.com/repos/edgeros/templates/git/blobs/82d34b67f221e03f8af3cd8a15543e7b59020c3f'
  // eslint-disable-next-line camelcase
  html_url: string; // https://github.com/edgeros/templates/blob/main/LICENSE
  sha: string; // 82d34b67f221e03f8af3cd8a15543e7b59020c3f
  size: number; // 1064
  type: string; // 'file'
}

export interface Component {
  dispose(): any
}

export type Disposable = vscode.Disposable | Component
