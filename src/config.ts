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
export const edgerosGlobalStateKeyTypo = 'EgerOs_Devs'
export const edgerosGlobalStateKey = 'edgeros.devices'

// EdgerOS log png, webview use
export const edgerosLogo: string = 'https://static.edgeros.com/logo.png'

// show WebView
export const edgerosWebResources: any = [
  {
    url: 'https://www.edgeros.com/edgeros/api/overview.html',
    title: 'API Documentation',
    'title_zh-cn': '参考手册'
  }
]
