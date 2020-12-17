import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as onezip from './utils/onezip';
const templateUpdateUrl = `http://localhost:5000/tpls.json`;

import * as os from 'os';
import {
  getPageStruct,
  getPath,
  HTMLPageOptions,
  ITemplate,
  TemplateOrigin,
} from './utils/common';

export async function showNewProjectPage(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'newEdgerEapProject', // Identifies the type of the webview. Used internally
    'new EAP Project', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );

  const projectDir = path.join(os.homedir(), 'EdgerOS Apps');
  const resPath = context.extensionPath;
  //
  const jspath = getPath(panel, resPath, 'resources', `newProject.js`);
  const csspath = getPath(panel, resPath, 'resources', `newProject.css`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const templates = templateConf.get('list') as ITemplate[];

  const pOpt: HTMLPageOptions = {
    jspath,
    csspath,
    templates,
    projectDir,
  };
  // And set its HTML content
  panel.webview.html = getHtmlStr(pOpt);

  // panel.webview.postMessage({ command: 'refactor' });
  panel.webview.onDidReceiveMessage((message) => {
    const { command } = message;

    switch (command) {
      case 'selectSavePath':
        vscode.window
          .showOpenDialog({
            title: '选择文件夹',
            openLabel: '选择',
            canSelectFolders: true,
            canSelectFiles: false,
          })
          .then((res: vscode.Uri[] | undefined) => {
            if (!res) {
              return;
            }
            const { path } = res[0];
            const savePath = path.replace(/^\//gim, '');
            panel.webview.postMessage({ savePath });
          });
        return;
      case 'copyDemo':
        vscode.commands.executeCommand('edgeros.newProject', message);
        panel.dispose();
        return;
    }
  });
}

function getHtmlStr(opt: HTMLPageOptions): string {
  // FUNCTIONS
  const { projectDir, templates } = opt;
  let tplTypeObject: { [key: string]: number } = {};
  const templateStr: string[] = [];

  templates?.forEach((item1: ITemplate) => {
    //
    let itemType = item1.type;
    itemType.forEach((typee) => {
      tplTypeObject[typee] = 1;
    });

    const tplStr = JSON.stringify(item1);
    var base64Str = Buffer.from(tplStr).toString('base64');

    //
    templateStr.push(`<span class="template ${itemType.join(' ')}" >`);
    templateStr.push(
      `<div class="img"><img onClick="changeTpl(this, 2 , '${item1.discription}', '${base64Str}' )" src="${item1.icon}" /></div>`
    );
    templateStr.push(
      `<h6 onClick="changeTpl(this, 1, '${item1.discription}', '${base64Str}' )" >${item1.displayName}</h6>`
    );
    templateStr.push(`</span>`);
  });

  let tplTypes: string[] = Object.keys(tplTypeObject);
  const tplsStr: string[] = [];
  tplsStr.push(
    `<span class="on" onClick="changeType(this, 'all')" >All</span>`
  );
  tplTypes?.forEach((item2) => {
    tplsStr.push(
      `<span onClick="changeType(this, '${item2}')" >${item2}</span>`
    );
  });

  const bodyHtml: string = `
    <section id="section">
    <div class="row">
    <div>
    <div class="type">
    ${tplsStr.join('')}
    </div>
    <div class="single" >
   ${templateStr.join('')}
</div>

</div>
</div>

<div class="row">
<span class="tit">模板描述:</span>
<span class="con discription">
<p id="discription_txt" ></p>
</span>
</div>

<div class="row ">
<span class="tit">项目名称:</span>
<span class="con inputTxt">
<input class="projectName" placeholder="输入项目名称"   type="text" />
</span>
</div>

<div class="row ">
<span class="tit">选择目录:</span>
<span class="con inputTxt selectDirWarp">
<input class="projectDir" placeholder="输入项目名称" value="${projectDir}" type="text" />
<span class="selectDir" onClick="selectDirFn()" >选择目录</span>
</span>
 
</div>

<div class="row">
<div class="newBtnWarp">
    <button class="newbtn" onClick="submitNew()">新建</button>
</div>
</div>
</section>
  `;

  return getPageStruct(opt, bodyHtml);
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
    return {state:false};
  }

  if (!projectName) {
    vscode.window.showWarningMessage('请输入项目名称！');
    return {state:false};
  }

  if (!name) {
    vscode.window.showWarningMessage('请输选择模板！');
    return {state:false};
  }

  if (!saveDir) {
    vscode.window.showWarningMessage('请输选择保存路径！');
    return {state:false};
  }

  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const tplUsing = templateConf.get('originUsing') as string;

  let tUrl = '';
  origin.forEach((item: TemplateOrigin) => {
    if (item.name === tplUsing) {
      tUrl = item.url;
    }
  });

  try {
    //
    // download
    let zipPath: string = path.join(__dirname, '..', 'tmp.zip');
    await downloadZip(tUrl, zipPath);

    // unzip
    const savePath: string = path.join(saveDir, projectName);
    await unzip(zipPath, savePath);
    return {
      state: true,
      projectDir: savePath,
    };
  } catch (err) {
    const str = JSON.stringify(err);
    console.error(str);
    vscode.window.showErrorMessage('Erorr: New Project.');
    return {state:false};
  }
}

function unzip(from: string, to: string): Promise<void> {
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

function downloadZip(url: string, saveDir: string): Promise<void> {
  return new Promise((resolve) => {
    var writeStream = fs.createWriteStream(saveDir);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    https.get(url, (data) => {
      data.on('data', (chunk) => {
        writeStream.write(chunk);
      });
      //
      data.on('end', () => {
        writeStream.close();
        resolve();
      });
      //
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
