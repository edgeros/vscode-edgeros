import * as vscode from 'vscode';
import {
  getPageStruct,
  getPath,
  HTMLPageOptions,
  ITemplate,
  TemplateOrigin,
} from './utils/common';

export async function showEdgerOSSettings(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'EdgerOSVSIXSettings', // Identifies the type of the webview. Used internally
    'EdgerOS VSIX Settings', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );
  const dir = context.extensionPath;
  //
  //
  const jspath = getPath(panel, dir, 'resources', `settingsUI.js`);
  const csspath = getPath(panel, dir, 'resources', `settingsUI.css`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const tplList = templateConf.get('list') as ITemplate[];
  const tplUsing = templateConf.get('originUsing') as string;

  const pOpt: HTMLPageOptions = {
    jspath,
    csspath,
    templates: tplList,
    tplUsing,
  };
  panel.webview.html = getHtmlStr(pOpt);

  panel.webview.onDidReceiveMessage((message) => {
    const { origin, command } = message;

    switch (command) {
      case 'changeTplOrigin':
        templateConf.update('originUsing', origin).then(() => {
          panel.dispose();
          vscode.commands.executeCommand('edgeros.openSettingsUI');
        });

        return;
    }
  });
}

function getHtmlStr(opt: HTMLPageOptions): string {
  const { jspath, csspath, templates, tplUsing } = opt;
  if (!templates) {
    return '';
  }
  const tplOrigin:TemplateOrigin[] = templates[0].origin;
  // FUNCTIONS
  const htmlArr = [];
  htmlArr.push(`<section>`);
  htmlArr.push(`<h4>请选择模板下载站点</h4>`);
  htmlArr.push(`<div>`);
  tplOrigin?.forEach((item) => {
    const active = item.name === tplUsing ? 'active' : '';
    htmlArr.push(
      `<button type="button" class="${item.name} ${active}" onclick="submitTemplateOrigin('${item.name}')">${item.name}</button>`
    );
  });
  htmlArr.push(`</div>`);
  htmlArr.push(`</section>`);
  const bodyHtml = htmlArr.join('');
  const str = getPageStruct(opt, bodyHtml);
  return str;
}
