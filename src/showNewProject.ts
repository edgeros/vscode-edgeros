import * as vscode from 'vscode';
import {
  getPageStruct,
  getPath,
  HTMLPageOptions,
  ITemplate,
} from './utils/common';

export async function showNewProjectPage(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'newEdgerEapProject', // Identifies the type of the webview. Used internally
    'new EAP Project', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );
  const dir = context.extensionPath;
  //
  //
  const jspath = getPath(panel, dir, 'resources', `newProject.js`);
  const csspath = getPath(panel, dir, 'resources', `newProject.css`);
  const templateConf = vscode.workspace.getConfiguration('edgeros.template');
  const templates = templateConf.get('list') as ITemplate[];

  const pOpt: HTMLPageOptions = {
    jspath,
    csspath,
    templates,
    projectDir: dir,
  };
  // And set its HTML content
  panel.webview.html = getHtmlStr(pOpt);

  // panel.webview.postMessage({ command: 'refactor' });
  panel.webview.onDidReceiveMessage((message) => {
    const { tplname, projectName, command } = message;
    debugger;
    switch (command) {
      case 'newProjectCommand':
        console.log(command);
        // vscode.commands.executeCommand(
        //   'edgeros.newProject',
        //   tplname,
        //   projectName
        // );
        // panel.dispose();
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
    templateStr.push(
      `<span class="template" >`
    );
    templateStr.push(`<div class="img"><img onClick="changeTpl(this, '${item1.name}', 2)" src="${item1.icon}" /></div>`);
    templateStr.push(`<h6 onClick="changeTpl(this, '${item1.name}', 1)" >${item1.displayName}</h6>`);
    templateStr.push(`</span>`);
  });

  let tplTypes: string[] = Object.keys(tplTypeObject);
  const tplsStr: string[] = [];
  tplTypes?.forEach((item2) => {
    tplsStr.push(
      `<span onClick="changeType(this, '${item2}')" >${item2}</span>`
    );
  });

  const bodyHtml: string = `
    <section id="section">
    <body class="main-layout ">
    <div class="row">
    <div>
    <div class="type">
    ${tplsStr.join('')}
    </div>
    <div class="single">
   ${templateStr.join('')}
</div></div>
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
<span class="con inputTxt">
<input class="projectDir" placeholder="输入项目名称" value="${projectDir}" type="text" /><span class="selectDir">选择目录</span>
</span>
 
</div>

<div class="row">
    <button class="newbtn" onClick="submitNew()">新建</button>
</div>
  `;

  return getPageStruct(opt, bodyHtml);
}
