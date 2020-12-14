import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';
import * as vscode from 'vscode';
//
import * as onezip from './utils/onezip';
import { ITemplate, TemplateOrigin } from './utils/common';

const templateUpdateUrl = `http://localhost:5000/tpls.json`;

export async function newProject(
  context: vscode.ExtensionContext,
  projectName: string,
  templateName: string
): Promise<boolean> {
  if ('cancel' === templateName) {
    console.warn('cancel select template.');
    return false;
  }

  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const tplList = templateConf.get('list') as ITemplate[];
  const tplUsing = templateConf.get('originUsing') as string;
  let template: any = null;
  tplList.forEach((item: ITemplate) => {
    if (item.name === templateName) {
      template = item;
    }
  });

  if (!template) {
    console.warn('Not found assgin template:', templateName);
    return false;
  }

  let origins = template.origin;
  let tUrl = '';
  origins.forEach((item: TemplateOrigin) => {
    if (item.name === tplUsing) {
      tUrl = item.url;
    }
  });

  //
  // download
  let templateDir: string = path.join(__dirname, '..');
  let zipPath: string = path.join(__dirname, '..', 'tmp.zip');
  await downloadZip(tUrl, zipPath);

  // unzip
  const savePath: string = path.join(templateDir, projectName);
  await unzip(zipPath, savePath);
  return true;
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
    http.get(url, (data) => {
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
    http.get(url, (data) => {
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
