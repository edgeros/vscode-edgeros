
const vscode = acquireVsCodeApi();

// const { jspath, csspath } = window.np;


function submitTemplateOrigin(vurEl, val) {

 const btns = document.querySelectorAll('.itemName')

 btns.forEach((item)=>{
  item.classList.remove("active");
 })

 vurEl.classList.add("active");

  vscode.postMessage({
    command: 'changeTplOrigin',
    origin: val,
  });

}
