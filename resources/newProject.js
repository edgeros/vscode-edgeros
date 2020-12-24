
let section = document.getElementById("section");
const vscode = acquireVsCodeApi();
let { projectDir } = window.edgeros;
let templateStr = '';
const templateWarp = document.querySelector(".single");
const projectDirInput = document.querySelector(".projectDir");
projectDirInput.value = projectDir;
const discriptionWarp = document.querySelector("#discription_txt");
const submitBtn = document.querySelector('.newbtn');

window.onmessage = onMessageFn;

function onMessageFn(event) {
  const { savePath, command } = event.data;
  if (command === 'selectFolder') {
    projectDirInput.value = savePath;
  }
  if (command === 'disableSubmitBtn') {
    submitBtn.disabled = true;
  }
};

function selectDirFn() {
  vscode.postMessage({
    command: 'selectSavePath'
  });

}
function changeType(spanEl, _tplType) {
  let borther = spanEl.parentElement.children;
  for (const item of borther) {
    item.classList.remove("on");
  }
  spanEl.classList.add("on");
  _togleTemplateForType(`span.template.${_tplType}`);
}

function changeTpl(ele, layer, discription, _templateStr) {
  let borther = {};
  let parentSpan = {};

  templateStr = _templateStr;

  if (layer === 1) {
    parentSpan = ele.parentElement;

  } else {
    parentSpan = ele.parentElement.parentElement;
  }
  borther = parentSpan.parentElement.children;
  for (const item of borther) {
    item.classList.remove("on");
  }
  parentSpan.classList.add("on");
  //
  discriptionWarp.innerText = discription;
}


function submitNew() {
  let projectName = document.querySelector('.projectName').value;

  templateStr = templateStr.trim();
  if (!templateStr) {
    // tipingSelectTemplate
    vscode.postMessage({
      command: 'tipingSelectTemplate'
    });
    return;
  }
  //
  const template = JSON.parse(window.atob(templateStr));
  projectName = projectName.trim();
  if (!projectName) {
    // tipingProjectName
    vscode.postMessage({
      command: 'tipingProjectName'
    });
    return;
  }

  let saveDir = projectDirInput.value;
  saveDir = saveDir.trim();
  if (!saveDir) {
    // tipingSelectTemplate
    vscode.postMessage({
      command: 'tipingSelectSaveDir'
    });
    return;
  }

  submitBtn.innerText = "新建中...";
  
  vscode.postMessage({
    command: 'copyDemo',
    projectName,
    saveDir,
    template
  });

}

function _togleTemplateForType(typeName) {
  const _list1 = templateWarp.querySelectorAll("span.template");
  _list1.forEach((item3) => {
    item3.style.display = "none";
  });
  //
  let _list = _list1;
  if (typeName !== 'span.template.all') {
    _list = templateWarp.querySelectorAll(typeName);
  }
  _list.forEach((item2) => {
    item2.style.display = "inline-block";
  });

}
