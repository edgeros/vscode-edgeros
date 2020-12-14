
const vscode = acquireVsCodeApi();

// const { jspath, csspath } = window.np;


function submitTemplateOrigin(val) {
  vscode.postMessage({
    command: 'changeTplOrigin',
    origin: val,
  });

}
