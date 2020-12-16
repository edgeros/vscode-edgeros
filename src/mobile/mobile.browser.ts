import * as vscode from 'vscode';
import { getPath } from '../utils/common';

import { MobileOptions, MobileType, getMobileTemplate } from './model';

export function showPhone(
  context: vscode.ExtensionContext,
  mobileType: MobileType = MobileType.IPhoneX,
  previewUrl: string = ''
) {
  const panel = vscode.window.createWebviewPanel(
    'EdgerMobileBrowser', // Identifies the type of the webview. Used internally
    'Mobile Browser', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );
  const dir = context.extensionPath;
  //
  //
  const refresh = getPath(panel, dir, 'media', 'refresh-outline.svg');
  const stop = getPath(panel, dir, 'media', 'stop-outline.svg');
  const close = getPath(panel, dir, 'media', 'close-outline.svg');
  const dark = getPath(panel, dir, 'media', 'contrast-outline.svg');
  const style = getPath(
    panel,
    dir,
    'resources',
    'mobile',
    'styles',
    `${mobileType}.css`
  );
  const appjs = getPath(panel, dir, 'resources', 'mobile', `app.js`);
  const indexcss = getPath(panel, dir, 'resources', 'mobile', `index.css`);
  const mOpt: MobileOptions = {
    url: previewUrl || 'http://docs.edgeros.com/guides/',
    refresh,
    stop,
    close,
    dark,
    style,
    appjs,
    indexcss,
    mobileType,
  };

  // And set its HTML content
  panel.webview.html = getMobileTemplate(mOpt);

  // panel.webview.postMessage({ command: 'refactor' });
  panel.webview.onDidReceiveMessage(
    (message) => {
      const { type, url, command } = message;
      switch (command) {
        case 'changeMobile':
          vscode.commands.executeCommand('mobile.change', url, type);
          panel.dispose();
          return;
      }
    }
    // undefined,
    // undefined
    // context.subscriptions
  );
}

