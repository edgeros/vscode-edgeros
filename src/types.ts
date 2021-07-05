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

import type { URL } from 'url'
import type { ProgressCallback } from 'isomorphic-git'

export type NodeSystemError = NodeJS.ErrnoException
export type ErrorHandler = (err: Error) => {}

export type TemplateType = 'Base'

export interface TemplateRepoConf {
  readonly github?: URL; // github repo
  readonly gitee?: URL; // gitee repo
  readonly local?: URL; // local file system repo (builtin template)
}

export interface TemplateConf {
  readonly name: string; // display name
  readonly banner: string; // url or base64 png
  readonly description: string; // short brief
  readonly type: TemplateType;
  readonly repository: TemplateRepoConf;
}

/**
 * TemplateConf instance, identified by template folder name and concrete the
 *   repository object to gitUrl field
 */
export interface Template extends Omit<TemplateConf, 'repository'> {
  readonly id: string;
  readonly source: string;
  readonly gitUrl: string;
}

export type TemplateCloneCallback = ProgressCallback

export interface TemplateCloneOptions {
  depth?: number;
  dir?: string;
  onProgress?: TemplateCloneCallback;
}

export type TemplateSource = 'Local' | 'Github' | 'Gitee'

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
