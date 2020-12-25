import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as ncp from 'ncp';
import * as onezip from './utils/onezip';
import { localize } from './utils/locale';
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
    'New Project', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );

  const projectDir = path.join(os.homedir(), 'EdgerOSApps');
  const resPath = context.extensionPath;
  //
  const jspath = getPath(panel, resPath, 'resources', `newProject.js`);
  const csspath = getPath(panel, resPath, 'resources', `newProject.css`);
  const folderIcon = getPath(panel, resPath, 'resources', `iconfont.js`);
  const loadingGif = getPath(panel, resPath, 'resources', `loadingGif.gif`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const templates = templateConf.get('list') as ITemplate[];

  const pOpt: HTMLPageOptions = {
    jspath,
    csspath,
    templates,
    projectDir,
    folderIcon,
    loadingGif
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
  const { projectDir, templates, loadingGif } = opt;
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
<span class="tit">${localize('template.discription.text', 'discription')}</span>
<span class="con discription">
<p id="discription_txt" ></p>
</span>
</div>

<div class="row ">
<span class="tit">${localize('template.projectName.text', 'Project name')}</span>
<span class="con inputTxt">
<input class="projectName" placeholder="${localize('template.projectName.input.text', 'discription')}"   type="text" />
</span>
</div>

<div class="row ">
<span class="tit">${localize('template.selectDirectory.text', 'Directory')}</span>
<span class="con inputTxt selectDirWarp">
<input class="projectDir" value="${projectDir}" type="text" readonly="readonly"  />
<span class="selectDir" onClick="selectDirFn()" >
<svg t="1608277092094" class="icon" viewBox="0 0 1170 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="728" width="200" height="200">
<path d="M45.48608 344.795429h33.792V45.494857A45.860571 45.860571 0 0 1 124.772937 0h336.896a44.836571 44.836571 0 0 1 34.450286 16.530286l156.379428 170.349714h393.362286a45.787429 45.787429 0 0 1 45.494857 44.836571v112.347429h34.450286a44.690286 44.690286 0 0 1 44.763429 44.836571 28.306286 28.306286 0 0 1-0.658286 7.314286l-71.68 581.266286a48.64 48.64 0 0 1-20.699429 33.133714 43.885714 43.885714 0 0 1-31.670857 13.092572H124.772937a43.154286 43.154286 0 0 1-31.012571-12.434286 51.2 51.2 0 0 1-21.357715-35.181714L0.43008 395.264a43.885714 43.885714 0 0 1 38.546286-49.664h1.389714z m124.342857 0h831.268572v-66.56H632.530651v-0.658286a44.324571 44.324571 0 0 1-32.402285-14.628572L441.700937 91.282286H169.536366z" fill="#FFD13A" p-id="729"></path>
</svg>
${localize('template.browse.text', 'browse')}</span>
</span>
 
</div>

<div class="row">
<span class="tit">&nbsp;</span>
<div class="con newBtnWarp">
   <span class="btnBox" > 
   <span class="loading" >
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 38 38" stroke="#fff">
    <g fill="none" fill-rule="evenodd">
        <g transform="translate(1 1)" stroke-width="2">
            <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
            <path d="M36 18c0-9.94-8.06-18-18-18">
                <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
            </path>
        </g>
    </g>
</svg>
   </span>
   <span class="newicon" >
   <svg t="1607589751542" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7970" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="18"><path d="M304.39168 1.75104c-0.96256 0.96256-2.22976 1.74848-2.82112 1.74848a1.0752 1.0752 0 0 0-1.07008 1.07264c0 1.38752-3.54048 4.928-4.928 4.928a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.39008-3.54048 4.93056-4.928 4.93056-0.5888 0-1.07264 0.4608-1.07264 1.024 0 0.5632-1.31584 2.36288-2.92608 3.99872-1.61024 1.6384-2.28608 2.07616-1.50016 0.97536 1.31328-1.84064 1.29024-1.89184-0.31232-0.63488-0.95488 0.75008-1.52832 1.7024-1.27232 2.11456 0.5632 0.91648-2.93376 4.24448-3.67616 3.49952-0.28928-0.28928-1.15456 0.27136-1.92 1.24672-1.28768 1.64352-1.24416 1.66912 0.60672 0.34816 1.1008-0.78592 0.66304-0.11008-0.97536 1.50016-1.63584 1.61024-3.43552 2.92608-3.99872 2.92608-0.5632 0-1.024 0.48384-1.024 1.07264 0 1.38752-3.54048 4.928-4.93056 4.928a1.0752 1.0752 0 0 0-1.07008 1.07264c0 1.38752-3.54048 4.928-4.928 4.928a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.36704-3.51488 4.9152-4.928 4.97408-0.5888 0.0256-0.97792 0.53504-0.86016 1.13152 0.1152 0.59648-0.67328 1.88416-1.75104 2.85952-1.07776 0.97536-1.96096 1.42336-1.96096 0.99584 0-0.42752-0.66816-0.22016-1.48736 0.45824-0.8192 0.68096-1.28 1.57696-1.024 1.98912 0.5248 0.84992-3.34592 4.65664-4.34176 4.27008-0.35584-0.13568-0.64512 0.12032-0.64512 0.57344 0 1.19296-3.6736 4.67712-4.93056 4.67712a1.0752 1.0752 0 0 0-1.07008 1.07264c0 0.5888-0.86784 1.93792-1.93024 3.00032-1.05984 1.05984-2.40896 1.92768-2.99776 1.92768a1.0752 1.0752 0 0 0-1.07264 1.07008c0 0.59136-0.86784 1.94048-1.92768 3.00032-1.0624 1.0624-2.41152 1.93024-3.00032 1.93024-0.5888 0-1.07264 0.4608-1.07264 1.024 0 0.5632-1.31584 2.36288-2.92608 3.99872-1.61024 1.6384-2.28608 2.07616-1.50016 0.97536 1.31328-1.84064 1.29024-1.89184-0.31232-0.63488-0.95488 0.75008-1.52832 1.7024-1.27232 2.11456 0.5632 0.91648-2.93376 4.24448-3.67616 3.49952-0.28928-0.28928-1.15456 0.27136-1.92 1.24672-1.28768 1.64352-1.24416 1.66912 0.60672 0.34816 1.1008-0.78592 0.66304-0.11008-0.97536 1.50016-1.63584 1.61024-3.43552 2.92608-3.99872 2.92608-0.5632 0-1.024 0.48384-1.024 1.07264 0 1.38752-3.54048 4.928-4.93056 4.928a1.0752 1.0752 0 0 0-1.07008 1.07264c0 1.38752-3.54048 4.928-4.928 4.928a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.36704-3.51488 4.9152-4.928 4.97408-0.5888 0.0256-0.97792 0.53504-0.86016 1.13152 0.1152 0.59648-0.67328 1.88416-1.75104 2.85952-1.07776 0.97536-1.96096 1.42336-1.96096 0.99584 0-0.42752-0.66816-0.22016-1.48736 0.45824-0.8192 0.68096-1.28 1.57696-1.024 1.98912 0.52992 0.86016-2.48064 3.84256-3.98848 3.95008-0.5504 0.0384-0.9984 0.44032-0.9984 0.89344 0 1.19296-3.6736 4.67712-4.93056 4.67712a1.0752 1.0752 0 0 0-1.07008 1.07264c0 0.5888-0.86784 1.93792-1.93024 3.00032-1.05984 1.05984-2.40896 1.92768-2.99776 1.92768a1.0752 1.0752 0 0 0-1.07264 1.07008c0 0.59136-0.86784 1.94048-1.92768 3.00032-1.0624 1.0624-2.41152 1.93024-3.00032 1.93024-0.5888 0-1.07264 0.4608-1.07264 1.024 0 0.5632-1.31584 2.36288-2.92608 3.99872-1.61024 1.6384-2.28608 2.07616-1.50016 0.97536 1.31328-1.84064 1.29024-1.89184-0.31232-0.63488-0.95488 0.75008-1.52832 1.7024-1.27232 2.11456 0.5632 0.91648-2.93376 4.24448-3.67616 3.49952-0.28928-0.28928-1.15456 0.27136-1.92 1.24672-1.28768 1.64352-1.24416 1.66912 0.60672 0.34816 1.1008-0.78592 0.66304-0.11008-0.97536 1.50016-1.63584 1.61024-3.43552 2.92608-3.99872 2.92608-0.5632 0-1.024 0.48384-1.024 1.07264 0 0.5888-0.86784 1.93792-1.93024 3.00032-1.05984 1.05984-2.40896 1.92768-3.00032 1.92768a1.0752 1.0752 0 0 0-1.07008 1.07264c0 0.5888-0.86784 1.93792-1.92768 2.99776-1.0624 1.0624-2.41152 1.93024-3.00032 1.93024a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.36704-3.51488 4.9152-4.928 4.97408-0.5888 0.0256-0.97792 0.53504-0.86016 1.13152 0.1152 0.59648-0.67328 1.88416-1.75104 2.85952-1.07776 0.97536-1.96096 1.42336-1.96096 0.99584 0-0.42752-0.66816-0.22016-1.48736 0.45824-0.8192 0.68096-1.28 1.57696-1.024 1.98912 0.5248 0.84992-3.34592 4.65664-4.34176 4.27008-0.35584-0.13568-0.64512 0.12032-0.64512 0.57344 0 1.19296-3.6736 4.67712-4.93056 4.67712a1.0752 1.0752 0 0 0-1.07008 1.07264c0 0.5888-0.86784 1.93792-1.93024 3.00032-1.05984 1.05984-2.40896 1.92768-2.99776 1.92768a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.39008-3.54048 4.93056-4.928 4.93056-0.5888 0-1.07264 0.4608-1.07264 1.024 0 0.5632-1.31584 2.36288-2.92608 3.99872-1.61024 1.6384-2.28608 2.07616-1.50016 0.97536 1.31328-1.84064 1.29024-1.89184-0.31232-0.63488-0.95488 0.75008-1.52832 1.7024-1.27232 2.11456 0.5632 0.91648-2.93376 4.24448-3.67616 3.49952-0.28928-0.28928-1.15456 0.27136-1.92 1.24672-1.28768 1.64352-1.24416 1.66912 0.60672 0.34816 1.1008-0.78592 0.66304-0.11008-0.97536 1.50016-1.63584 1.61024-3.43552 2.92608-3.99872 2.92608-0.5632 0-1.024 0.48384-1.024 1.07264 0 1.38752-3.54048 4.928-4.93056 4.928a1.0752 1.0752 0 0 0-1.07008 1.07264c0 0.5888-0.86784 1.93792-1.92768 2.99776-1.0624 1.0624-2.41152 1.93024-3.00032 1.93024a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.36704-3.51488 4.9152-4.928 4.97408-0.5888 0.0256-0.97792 0.53504-0.86016 1.13152 0.1152 0.59648-0.67328 1.88416-1.75104 2.85952-1.07776 0.97536-1.96096 1.42336-1.96096 0.99584 0-0.42752-0.66816-0.22016-1.48736 0.45824-0.8192 0.68096-1.28 1.57696-1.024 1.98912 0.52992 0.86016-2.48064 3.84256-3.98848 3.95008-0.5504 0.0384-0.9984 0.44032-0.9984 0.89344 0 1.19296-3.6736 4.67712-4.93056 4.67712a1.0752 1.0752 0 0 0-1.07008 1.07264c0 1.38752-3.54048 4.928-4.928 4.928a1.0752 1.0752 0 0 0-1.07264 1.07008c0 1.39008-3.54048 4.93056-4.928 4.93056-0.5888 0-1.07264 0.4608-1.07264 1.024 0 0.5632-1.31584 2.36288-2.92608 3.99872-1.61024 1.6384-2.28608 2.07616-1.50016 0.97536 1.31328-1.84064 1.29024-1.89184-0.31232-0.63488-0.95488 0.75008-1.52832 1.7024-1.27232 2.11456 0.5632 0.91648-2.93376 4.24448-3.67616 3.49952-0.28928-0.28928-1.15456 0.27136-1.92 1.24672-1.28768 1.64352-1.24416 1.66912 0.60672 0.34816 1.1008-0.78592 0.66304-0.11008-0.97536 1.50016-1.63584 1.61024-3.43552 2.92608-3.99872 2.92608-0.5632 0-1.024 0.48384-1.024 1.07264 0 1.38752-3.54048 4.928-4.93056 4.928a1.0752 1.0752 0 0 0-1.07008 1.07264c0 1.38752-3.54048 4.928-4.928 4.928a1.0752 1.0752 0 0 0-1.07264 1.07008c0 0.59136-0.78592 1.85856-1.74848 2.82112-1.66144 1.66144-1.75104 20.17536-1.75104 360.68096V1024h614.99904v-102.99904h-512V308.00128H308.00128V102.99904h408v307.00032h104V0H563.072c-243.36128 0-257.02144 0.09216-258.68032 1.75104m411.6096 612.2496v102.00064H512v104h204.00128V1024h104V820.00128H1024v-104H820.00128V512h-104v102.00064" p-id="7971"></path></svg>
   </span>
   <button class="newbtn" onClick="submitNew()">${localize('template.new.text', 'browse')}</button></span>
</div>
</div>
</section>
  `;

  return getPageStruct(opt, bodyHtml);
}
