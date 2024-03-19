/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : config.ts
 * Desc   : configurations
 */

// EdgerOS default configurations
export const edgerosIdePort: number = 82
export const edgerosConsolePort: number = 81

// Device list storage key
export const edgerosGlobalStateKeyTypo: string = 'EgerOs_Devs'
export const edgerosGlobalStateKey: string = 'edgeros.devices'
export const edgerosGlobalUserInfoKey:string = 'edgeros.userInfo'

// Project build path key,workspaceState save
export const edgerosBuildInfoKey: string = 'edgeros.buildInfo'

// Template cache information key
export const edgerosGlobalStateKeyTemplates: string = 'edgeros.templatesInfo'

// vscode version key
export const edgerosVersionKey: string = 'edgeros.version'

// project definde path save key
export const projectPathSave: string = 'edgeros.projectPathSave'

// show WebView
export const edgerosWebResources = {
  apiDoc: 'https://www.edgeros.com/edgeros/api/overview',
  DeveloperAgreement: 'https://www.edgeros.com/legal/developer',
  cloudApiBase: 'https://api.edgeros.com'
}
