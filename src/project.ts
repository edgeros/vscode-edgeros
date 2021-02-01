import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as ncp from 'ncp';
import * as onezip from './utils/onezip';
import { localize } from './utils/locale';
const templateUpdateUrl = `http://localhost:5000/tpls.json`;
import * as ejs from 'ejs';

import * as os from 'os';
import {
  getPageStruct,
  getPath,
  HTMLPageOptions,
  ITemplate,
  TemplateOrigin,
} from './utils/common';
import { IncomingMessage } from 'http';

export async function showNewProjectPage(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'newEdgerEapProject', // Identifies the type of the webview. Used internally
    localize('template.new.text', 'New Project'), // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );

  const projectDir = path.join(os.homedir(), 'EdgerOSApps');
  const resPath = context.extensionPath;
  //
  const folderIcon = getPath(panel, resPath, 'resources', `iconfont.js`);
  const loadingGif = getPath(panel, resPath, 'resources', `loadingGif.gif`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const templates = templateConf.get('list') as ITemplate[];

  const jspath = getPath(panel, resPath, 'view/edgerNewProject/edgerNewProject.js');
  const csspath = getPath(panel, resPath, 'view/edgerNewProject/edgerNewProject.css');
  const vueFileUri = getPath(panel, resPath, 'view/lib/vue.js');

  // And set its HTML content
  panel.webview.html = await ejs.renderFile(path.join(resPath, 'view', 'edgerNewProject/edgerNewProject.ejs'), {
    jspath: jspath,
    csspath: csspath,
    templates: templates,
    folderIcon: folderIcon,
    projectDir: path.join(os.homedir(), 'EdgerOSApps').replace(/\\/g, '/'),
    vueFileUri: vueFileUri,
    language: {
      newProjectBut: localize('template.new.text'),
      browseBut: localize('template.browse.text'),
      selectDirectory: localize('template.selectDirectory.text'),
      projectName: localize('template.projectName.text'),
      projectInputName: localize('template.projectName.input.text'),
      discription: localize('template.discription.text'),
    }
  });

  // panel.webview.postMessage({ command: 'refactor' });
  panel.webview.onDidReceiveMessage(async (message) => {
    const { command } = message;

    switch (command) {
      case 'tipingSelectSaveDir':
        vscode.window.showWarningMessage(localize('project.tipingSelectSaveDir', 'Please select Save directory'));
        break;
      case 'tipingSelectTemplate':
        vscode.window.showWarningMessage(localize('project.tipingSelectTemplate', 'Please select a template'));
        break;
      case 'tipingProjectName':
        vscode.window.showWarningMessage(localize('project.tipingProjectName', 'Please input project name'));
        break;
      case 'selectSavePath':
        vscode.window
          .showOpenDialog({
            title: localize('project.select.folder', 'Select Folder'),
            openLabel: localize('project.select', 'Select'),
            canSelectFolders: true,
            canSelectFiles: false,
          })
          .then((res: vscode.Uri[] | undefined) => {
            if (!res) {
              return;
            }
            let { path } = res[0];
            if (process.platform === 'win32') {
              path = path.replace(/^\//gim, '');
            }

            panel.webview.postMessage({
              command: 'selectFolder',
              savePath: path,
            });
          });
        return;
      case 'copyDemo':
        const res = await verifyParam(message);
        if (res) {
          panel.webview.postMessage({ command: 'disableSubmitBtn' });
          vscode.commands
            .executeCommand('edgeros.newProject', message)
            .then((res) => {
              panel.dispose();
            });
          return;
        }
        vscode.window.showWarningMessage(localize('project.exists', 'Project already exists'));
        panel.webview.postMessage({ command: 'activeNewProject' });
    }
  });
}

async function verifyParam(message: {
  command: string;
  [key: string]: any;
}): Promise<boolean> {
  const { projectName, saveDir } = message;
  return new Promise((resolve) => {
    const tmpPath = path.join(saveDir, projectName);
    try {
      fs.statSync(tmpPath);
      resolve(false);
    } catch (e) {
      resolve(true);
    }
  });
}

export async function doNewProject(
  context: vscode.ExtensionContext,
  params: any
): Promise<{
  state: boolean;
  projectDir?: string;
}> {
  const { projectName, saveDir, template } = params;
  const { name = '', origin = [] } = template as ITemplate;

  if ('cancel' === name) {
    return { state: false };
  }

  if (!projectName) {
    vscode.window.showWarningMessage(localize('project.tipingProjectName', 'Please input project name'));
    return { state: false };
  }

  if (!name) {
    vscode.window.showWarningMessage(localize('project.tipingSelectTemplate', 'Please select a template'));
    return { state: false };
  }

  if (!saveDir) {
    vscode.window.showWarningMessage(localize('project.tipingSelectSaveDir', 'Please select Save directory'));
    return { state: false };
  }


  try {
    fs.statSync(saveDir);
  } catch (err) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const tplUsing = (templateConf.get('originUsing') as string) || 'github';

  let tUrl = '';
  origin.forEach((item: TemplateOrigin) => {
    if (item.name.toLowerCase() === tplUsing.toLowerCase()) {
      tUrl = item.url;
    }
  });

  //
  const userTmpDir = os.homedir();
  // download
  const zipPath: string = path.join(userTmpDir, 'tmp.zip');
  const fileName = await downloadZip(tUrl, zipPath, tplUsing);
  if (!fileName) {
    vscode.window.showWarningMessage(localize('template.download.error', `Download template error ${tUrl}`));
    return { state: false };
  }
  // unzip
  const saveTmpPath: string = path.join(userTmpDir, 'tmp');
  await unzip(zipPath, saveTmpPath);

  // copy
  const sourceDir: string = path.join(saveTmpPath, fileName);
  const savePath: string = path.join(saveDir, projectName);
  return copyProject(sourceDir, savePath, zipPath, saveTmpPath);
}

function assertNotExtis(_path: string): boolean {
  try {
    const fsstat = fs.statSync(_path);
    if (fsstat) {
      return false;
    }
    return true;
  } catch (err) {
    return true;
  }
}

function copyProject(
  sourceDir: string,
  savePath: string,
  zipPath: string,
  saveTmpPath: string
): Promise<{ state: boolean; projectDir?: string }> {
  return new Promise((resolve) => {
    try {
      const notExtis: boolean = assertNotExtis(savePath);
      if (!notExtis) {
        const openProjectBtn = localize('project.open', 'Open Project');
        vscode.window
          .showWarningMessage(localize('project.exists', 'Project already exists'), openProjectBtn)
          .then((activeBtn) => {
            if (activeBtn === openProjectBtn) {
              let uri = vscode.Uri.file(savePath);
              vscode.commands
                .executeCommand('vscode.openFolder', uri)
                .then((success) => {
                  if (!success) {
                    vscode.window.showErrorMessage(localize('project.new.error', 'New project error.'));
                  }
                });
            }
          });

        resolve({ state: false });
        return;
      }
      ncp(sourceDir, savePath, (err) => {
        if (err) {
          return console.error(err);
        }
        fs.unlink(zipPath, (err) => {
          rmdir(saveTmpPath, () => {
            // console.log('删除临时文件！');
          });
        });
        resolve({
          state: true,
          projectDir: savePath,
        });
      });
    } catch (err) {
      const str = JSON.stringify(err);
      console.error(str);
      vscode.window.showErrorMessage(localize('project.new.error', 'New project error.'));
      resolve({ state: false });
    }
  });
}

function rmdir(dir: string, callback: fs.NoParamCallback) {
  fs.readdir(dir, (err, files) => {
    function next(index: number) {
      if (index === files.length) {
        return fs.rmdir(dir, callback);
      }
      let newPath = path.join(dir, files[index]);

      fs.stat(newPath, (err, stat) => {
        if (stat.isDirectory()) {
          rmdir(newPath, () => next(index + 1));
        } else {
          fs.unlink(newPath, () => next(index + 1));
        }
      });
    }
    next(0);
  });
}

function unzip(from: string, to: string): Promise<void> {
  if (fs.existsSync(to)) {
    rmdir(to, () => { });
  }
  fs.mkdirSync(to, { recursive: true });
  const extract = onezip.extract(from, to);

  return new Promise((resolve) => {
    extract.on('file', (name: string) => {
      // console.log(name);
    });

    extract.on('start', (percent: string) => {
      // console.log('extracting started');
    });

    extract.on('progress', (percent: string) => {
      // console.log(percent + '%');
    });

    extract.on('error', (error: any) => {
      console.error(error);
    });

    extract.on('end', () => {
      // console.log('done');
      resolve();
    });
  });
}
function getFilenameForHeader(data: IncomingMessage, tplUsing: string): string {
  const contentDisposition: string = data.headers['content-disposition'] || '';
  // attachment; filename=tpl-blank-main.zip // github
  // attachment;filename*=UTF-8''MS-RTOS-AutoTester-v0.9.10.zip  // zoho
  if (contentDisposition) {
    let fileName: string[] = [];
    if (tplUsing.toLowerCase() === 'github') {
      fileName = contentDisposition.split('filename=');
    } else {
      fileName = contentDisposition.split("filename*=UTF-8''");
    }
    if (fileName && fileName.length) {
      let refFn = fileName[1].split('.');
      return refFn[0];
    }
  }
  return '';
}

function downloadZip(
  url: string,
  saveDir: string,
  tplUsing: string
): Promise<string> {
  return new Promise((resolve) => {
    if (fs.existsSync(saveDir)) {
      fs.unlinkSync(saveDir);
    }

    let writeStream = fs.createWriteStream(saveDir);
    writeStream.on('close', () => {
      resolve(fileName);
    });


    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    let fileName = '';
    https.get(url, (data) => {
      if (data.statusCode !== 200) {
        console.error(data);
      }
      fileName = getFilenameForHeader(data, tplUsing);
      data.on('data', (chunk) => {
        writeStream.write(chunk);
      });
      data.on('error', (err) => {
        const errStr: string = JSON.stringify(err);
        console.error(err);
        vscode.window.showErrorMessage(errStr);
      });
      data.on('end', () => {
        writeStream.end();
      });
    });
  });
}

export async function updateTemplate(
  context: vscode.ExtensionContext,
  url: string
) {
  return new Promise((resolve) => {
    const tmp: string[] = [];
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    https.get(url, (data) => {
      data.on('data', (chunk) => {
        console.log('chunk:', chunk);
        tmp.push(chunk);
      });
      //
      data.on('end', () => {
        const str = tmp.join('');
        const tmplates: ITemplate[] = JSON.parse(str);
        const templateConf = vscode.workspace.getConfiguration(
          'edgeros.template'
        );
        templateConf.update('list', tmplates);
        resolve(0);
      });
      //
    });
  });
}

