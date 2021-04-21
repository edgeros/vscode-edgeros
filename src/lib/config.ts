// device list storage key
export const devsStateKey: string = "EgerOs_Devs";
// edgeros config key
export const edgerosCfgKey: string = "EgerOs_Config";
// edgeros log png
export const edgerosLogo: string = "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png";
export const edgerosIdePort: number = 82;
export const edgerConsolePort: number = 81;
// show WebView
export const edgerOsWebData: any = [
  {
    url: "https://docs.t.e0a.cc/edgeros/api/overview.html",
    title: 'Api文档',
    titleEn: 'api'
  },
  {
    url: "https://www.edgeros.com/",
    title: "官网",
    titleEn: 'skypegmwcn'
  }
];

// create project template list
export const templateList = [
  {
    tplName: "simple (local)",
    imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
    type: 'local'
  },
  {
    tplName: "simple (cloud)",
    imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
    type: 'cloud',
    downloadUrl: 'http://127.0.0.1:82/download/file/simple_tpl.zip'
  }
]