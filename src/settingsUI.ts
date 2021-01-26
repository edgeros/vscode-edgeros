import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';

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

  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const tplList = templateConf.get('list') as ITemplate[];
  const tplUsing = templateConf.get('originUsing') as string;

  let jsFileUri = getPath(panel, dir, 'view', 'edgerOsSetting/edgerOsSetting.js');
  let cssFileUri = getPath(panel, dir, 'view', 'edgerOsSetting/edgerOsSetting.css');
  let vueFileUri = getPath(panel, dir, 'view', 'lib/vue.js');



  let PugOptions = {
    vueFileUri: vueFileUri,
    jsFileUri: jsFileUri,
    cssFileUri: cssFileUri,
    tplList: tplList,
    tplUsing: tplUsing,
  };
  panel.webview.html = await ejs.renderFile(path.join(dir, 'view', 'edgerOsSetting/edgerOsSetting.ejs'), PugOptions);

  panel.webview.onDidReceiveMessage((message) => {
    const { origin, command } = message;

    switch (command) {
      case 'changeTplOrigin':
        templateConf.update('originUsing', origin).then(() => {
          vscode.window.showInformationMessage(`模板下载来源切换为: ${origin}`);
        });
        return;
    }
  });
}