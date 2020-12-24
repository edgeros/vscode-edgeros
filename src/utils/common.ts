import * as vscode from 'vscode';
import * as path from 'path';

export function getPath(
  panel: vscode.WebviewPanel,
  dir: string,
  ...args: string[]
): vscode.Uri {
  const uri = vscode.Uri.file(path.join(dir, ...args));
  return panel.webview.asWebviewUri(uri);
}

export interface ITemplate {
  type: string[];
  name: string;
  displayName: string;
  icon: string;
  discription: string;
  origin: TemplateOrigin[];
}
export interface TemplateOrigin {
  name: string;
  url: string;
}

export interface HTMLPageOptions {
  jspath: vscode.Uri;
  csspath: vscode.Uri;
  templates?: ITemplate[];
  tplUsing?: string;
  projectDir?: string;
  mobPng?: vscode.Uri;
  loadingGif?: vscode.Uri;
  folderIcon?: vscode.Uri;
}

export function getPageStruct(opt: HTMLPageOptions, bodyHtml: string) {
  const { csspath, jspath, folderIcon='' } = opt;
 
  var html = [];
  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push('<meta charset="UTF-8" />');
  html.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
  );
  html.push('<title>MobileView</title>');
  html.push(`<link rel="stylesheet" href="${csspath}" />`);
  html.push('<script>');
  html.push(`window.edgeros = ${JSON.stringify(opt)};`);
  html.push('</script>');
  html.push('</head>');
  html.push(`<body>`);
  html.push(`${bodyHtml}`);
  html.push(`</body>`);
  html.push(`<script src="${jspath}" ></script>`);
  if(folderIcon){
    html.push(`<script src="${folderIcon}" ></script>`);
  }
  html.push(`	</html>`);

  return html.join('');
}
