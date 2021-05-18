// device list storage key
export const devsStateKey: string = "EgerOs_Devs";
// edgeros log png ,webview use
export const edgerosLogo: string = "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/logo.png";
export const edgerosIdePort: number = 82;
export const edgerConsolePort: number = 81;
// show WebView
export const edgerOsWebData: any = [
  {
    url: "https://docs.t.e0a.cc/edgeros/api/overview.html",
    title: 'API Documentation',
    "title_zh-cn": '接口文档'

  }
];

/**
 * [{
 * tempName: "模板名称",
 * description:"模板简介",
 * icon:"模板图片",
 * gitUrl:"git地址",
 * downloadUrl:"下载地址",
 * type:"模板类型",//enum[templateTypes]
 * location:"local",// local or cloud
 * }]
 */
export const templates = [
  {
    tempName: "simple-local",
    description: "Very basic and simple project template",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
    gitUrl: "",
    downloadUrl: "",
    location: "local",
    type: 'Base'
  },
  // {
  //   tempName: "simple-cloud",
  //   description: "Very basic and simple project template",
  //   icon:
  //     "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
  //   gitUrl: "https://gitee.com/fu-wenhao/mrc-asset2.git",
  //   downloadUrl: "http://127.0.0.1:82/download/file/simple_tpl.zip",
  //   location: "cloud",
  //   type: 'Base'
  // },
]

/**
 * 模板类型及模板介绍
 */
export const templateTypes = [{
  type: 'All',
  desc: ''
},
{
  type: 'Base',
  desc: 'Converges basic template types'
}]