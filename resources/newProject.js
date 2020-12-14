
let section = document.getElementById("section");
const vscode = acquireVsCodeApi();

// const { jspath, csspath } = window.np;
let tplname = '';
let tplType = '';

window.addEventListener('load', () => {

});
function changeType(spanEl, _tplType) {
  let borther = spanEl.parentElement.children;
  for (const item of borther) {
    item.classList.remove("on");
  }
  spanEl.classList.add("on");
  tplType = _tplType;
}


function changeTpl(event, name, layer) {
  let borther = {};
  let parentSpan = {};
  if (layer === 1) {
    parentSpan = event.parentElement;

  } else {
    parentSpan = event.parentElement.parentElement;
  }
  borther = parentSpan.parentElement.children;
  for (const item of borther) {
    item.classList.remove("on");
  }
  parentSpan.classList.add("on");
  tplname = name || "";
}

function submitNew() {
  const projectName = document.querySelector('.projectName').value;
  debugger;
  vscode.postMessage({
    command: 'newProjectCommand',
    tplname: tplname || 'empty',
    projectName: projectName || 'eap1'
  });

}

