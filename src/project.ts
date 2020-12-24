import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as ncp from 'ncp';
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
import { IncomingMessage } from 'http';

export async function showNewProjectPage(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'newEdgerEapProject', // Identifies the type of the webview. Used internally
    'new EAP Project', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );

  const projectDir = path.join(os.homedir(), 'EdgerOSApps');
  const resPath = context.extensionPath;
  //
  const jspath = getPath(panel, resPath, 'resources', `newProject.js`);
  const csspath = getPath(panel, resPath, 'resources', `newProject.css`);
  const folderIcon = getPath(panel, resPath, 'resources', `iconfont.js`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const templates = templateConf.get('list') as ITemplate[];

  const pOpt: HTMLPageOptions = {
    jspath,
    csspath,
    templates,
    projectDir,
    folderIcon,
  };
  // And set its HTML content
  panel.webview.html = getHtmlStr(pOpt);

  // panel.webview.postMessage({ command: 'refactor' });
  panel.webview.onDidReceiveMessage(async (message) => {
    const { command } = message;

    switch (command) {
      case 'tipingSelectSaveDir':
        vscode.window.showWarningMessage('请选保存目录！');
        break;
      case 'tipingSelectTemplate':
        vscode.window.showWarningMessage('请选择模板！');
        break;
      case 'tipingProjectName':
        vscode.window.showWarningMessage('请输入项目名称！');
        break;
      case 'selectSavePath':
        vscode.window
          .showOpenDialog({
            title: '选择文件夹',
            openLabel: '选  择',
            canSelectFolders: true,
            canSelectFiles: false,
          })
          .then((res: vscode.Uri[] | undefined) => {
            if (!res) {
              return;
            }
            let { path } = res[0];
           
            if(process.platform==='win32'){
              path = path.replace(/^\//gim, '');
            }
           
            panel.webview.postMessage({command :'selectFolder', savePath:path });
          });
        return;
      case 'copyDemo':
        const res = await verifyParam(message);
        if (res) {
          panel.webview.postMessage({command :'disableSubmitBtn'  });
          vscode.commands.executeCommand('edgeros.newProject', message).then((res)=>{
            panel.dispose();
          });
        }else{
          vscode.window.showWarningMessage('已存在该项目！');
        }
        return;
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
    vscode.window.showWarningMessage('请输入项目名称！');
    return { state: false };
  }

  if (!name) {
    vscode.window.showWarningMessage('请输选择模板！');
    return { state: false };
  }

  if (!saveDir) {
    vscode.window.showWarningMessage('请输选择保存路径！');
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
    if(!fileName){
      console.error("Download template error.", tUrl);
      return {state:false};
    }

    // unzip
    const saveTmpPath: string = path.join(userTmpDir, 'tmp');
    await unzip(zipPath, saveTmpPath);

    // copy
    const sourceDir: string = path.join(saveTmpPath, fileName);
    const savePath: string = path.join(saveDir, projectName);
    return copyProject(sourceDir, savePath, zipPath, saveTmpPath);
 
  
}

function copyProject(sourceDir:string, savePath:string, zipPath:string, saveTmpPath:string):Promise<{state:boolean,projectDir?:string}>{

  return new Promise((resolve) => {
    try {
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
  vscode.window.showErrorMessage('Erorr: New Project.');
  resolve( { state: false })
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
    var writeStream = fs.createWriteStream(saveDir);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    let fileName = '';
    https.get(url, (data) => {
      if(data.statusCode !== 200){
        console.error(data);
      }
      fileName = getFilenameForHeader(data, tplUsing);
      data.on('data', (chunk) => {
        writeStream.write(chunk);
      });
      data.on('error', (err) => {
        const errStr:string = JSON.stringify(err);
        console.error(err);
        vscode.window.showErrorMessage(errStr);
      });
      //
      data.on('end', () => {
        writeStream.close();
        resolve(fileName);
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
<input class="projectDir" value="${projectDir}" type="text" readonly="readonly"  />
<span class="selectDir" onClick="selectDirFn()" >
<svg t="1608277092094" class="icon" viewBox="0 0 1170 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="728" width="200" height="200"><path d="M45.48608 344.795429h33.792V45.494857A45.860571 45.860571 0 0 1 124.772937 0h336.896a44.836571 44.836571 0 0 1 34.450286 16.530286l156.379428 170.349714h393.362286a45.787429 45.787429 0 0 1 45.494857 44.836571v112.347429h34.450286a44.690286 44.690286 0 0 1 44.763429 44.836571 28.306286 28.306286 0 0 1-0.658286 7.314286l-71.68 581.266286a48.64 48.64 0 0 1-20.699429 33.133714 43.885714 43.885714 0 0 1-31.670857 13.092572H124.772937a43.154286 43.154286 0 0 1-31.012571-12.434286 51.2 51.2 0 0 1-21.357715-35.181714L0.43008 395.264a43.885714 43.885714 0 0 1 38.546286-49.664h1.389714z m124.342857 0h831.268572v-66.56H632.530651v-0.658286a44.324571 44.324571 0 0 1-32.402285-14.628572L441.700937 91.282286H169.536366z" fill="#FFD13A" p-id="729"></path></svg>
浏览</span>
</span>
 
</div>

<div class="row">
<div class="newBtnWarp">
    <button class="newbtn" onClick="submitNew()">新&nbsp;&nbsp;建</button>
</div>
</div>
</section>
  `;

  return getPageStruct(opt, bodyHtml);
}
