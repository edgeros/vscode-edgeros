/*
 * @Author: FuWenHao  
 * @Date: 2021-04-13 15:56:22 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-13 19:50:30
 */
import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs-extra';
/**
 * 将本地文件资源转换为webview需要的uri
 * @param panel 
 * @param filePath 
 * @returns 
 */
export function changeUri(panel: vscode.WebviewPanel, filePath: string): vscode.Uri {
  const uri = vscode.Uri.file(filePath);
  return panel.webview.asWebviewUri(uri);
}
/**
 * 获取webview 基础资源
 * @param viewFileName 
 * @param currentPanel 
 * @param context 
 * @returns 
 */
export async function getWebViewBaseUris(viewFileName: string, currentPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  // 获取颜色主题 kind:1浅色主题 2深色主题 3高对比度 
  // vscode.window.activeColorTheme; 
  //base
  let basePath = path.join(context.extensionPath, 'view');
  let vueJsUri = changeUri(currentPanel, path.join(basePath, 'lib', 'vue.js'));
  let elementUiJsUri = changeUri(currentPanel, path.join(basePath, 'lib', 'element-ui.js'));
  let ttfUri = changeUri(currentPanel, path.join(basePath, 'lib', 'fonts', 'element-icons.ttf'));
  let woffUri = changeUri(currentPanel, path.join(basePath, 'lib', 'fonts', 'element-icons.woff'));
  // css file font uri update
  let cssStr = await ejs.renderFile(path.join(context.extensionPath, 'view', 'lib', 'element-ui.css'), {
    ttfUri,
    woffUri
  });
  let cssPath = path.join(context.extensionPath, 'view', viewFileName, 'tmp_element-ui.css');
  fs.writeFileSync(cssPath, cssStr);
  let elementUiCssUri = changeUri(currentPanel, cssPath);
  // 获取webview入口文件
  let indexJsUri = changeUri(currentPanel, path.join(context.extensionPath, 'view', viewFileName, 'index.js'));
  return {
    vueJsUri,
    elementUiJsUri,
    elementUiCssUri,
    indexJsUri
  };
}