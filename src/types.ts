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

import type { ProgressCallback } from 'isomorphic-git'

export type NodeSystemError = NodeJS.ErrnoException

export interface TemplateRepoConf {
  readonly github: string;
  readonly gitee?: string;
}

export interface TemplateConf {
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly repository: TemplateRepoConf;
}

export type TemplateCloneCallback = ProgressCallback

export interface TemplateCloneOptions {
  depth?: number;
  dir?: string;
  onProgress?: TemplateCloneCallback;
}

export interface WorkspaceSettings {
  versionIncrement: boolean;
  buildSuffix: 'eap' | 'zip';
  installEAP: 'Auto' | 'Manual';
  templateSource: 'Github' | 'Gitee';
}

export type TemplateSource = 'Github' | 'Gitee'
