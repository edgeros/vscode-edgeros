/*
 * @Author: FuWenHao  
 * @Date: 2021-04-13 15:56:22 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-13 16:00:17
 */
import * as vscode from 'vscode';
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
