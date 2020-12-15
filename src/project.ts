import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
import * as vscode from 'vscode';
//
import * as onezip from './utils/onezip';
import { ITemplate, TemplateOrigin } from './utils/common';

const templateUpdateUrl = `http://localhost:5000/tpls.json`;

export async function newProject(
  context: vscode.ExtensionContext,
  params: any
): Promise<boolean> {
  const { projectName, saveDir, template  } = params;
  const { name = '', origin = [] } = template as ITemplate;

  if ('cancel' === name) {
    return false;
  }

  if (!projectName) {
    vscode.window.showWarningMessage('请输入项目名称！');
    return false;
  }

  if (!name) {
    vscode.window.showWarningMessage('请输选择模板！');
    return false;
  }

  if (!saveDir) {
    vscode.window.showWarningMessage('请输选择保存路径！');
    return false;
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
    return true;
  } catch (err) {
    console.error(JSON.stringify(err));
    return false;
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
