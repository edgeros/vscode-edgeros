const vscode = acquireVsCodeApi();


const app = new Vue({
  el: '#app',
  data: () => {
    return {
      typeArray: [],
      selectType: '',
      templateObjs: [],
      selectTemp: {},
      projectName: '',
      savePath: infoSavePath,
      newProjectRuning: false
    };
  },
  filters: {},
  created() {
    const templatesObj = JSON.parse(templates);
    templatesObj.forEach(template => {
      this.typeArray = template.type;
      this.typeArray.unshift('All');
      this.selectType = this.typeArray[0];
      this.templateObjs.push(template);
    });
    const previousState = vscode.getState();
    if (previousState) {
      this.selectType = previousState.data.selectType;
      this.selectTemp = previousState.data.selectTemp;
      this.projectName = previousState.data.projectName;
      this.savePath = previousState.data.savePath;
    }
  },
  watch: {
    savePath: function () {
      vscode.setState({ data: this.$data });

    },
    projectName: function () {
      vscode.setState({ data: this.$data });
    },
  },
  methods: {
    changeType: function (type) {
      this.selectType = type;
      vscode.setState({ data: this.$data });
    },
    changeTpl: function (tpl) {
      this.selectTemp = tpl;
      vscode.setState({ data: this.$data });
    },
    selectDirFn: function () {
      vscode.postMessage({
        command: 'selectSavePath'
      });
    },
    submitNew: function () {
      let projectName = this.projectName;
      if (!this.selectTemp.displayName) {
        // tipingSelectTemplate
        vscode.postMessage({
          command: 'tipingSelectTemplate'
        });
        return;
      }
      const template = this.selectTemp;
      projectName = projectName.trim();
      if (!projectName) {
        // tipingProjectName
        vscode.postMessage({
          command: 'tipingProjectName'
        });
        return;
      }

      let saveDir = this.savePath.trim();
      if (!saveDir) {
        // tipingSelectTemplate
        vscode.postMessage({
          command: 'tipingSelectSaveDir'
        });
        return;
      }
      this.newProjectRuning = true;
      vscode.postMessage({
        command: 'copyDemo',
        projectName,
        saveDir,
        template
      });
    },
    onMessageFn: function (event) {
      const { savePath, command } = event.data;
      if (command === 'selectFolder') {
        this.savePath = savePath;
        return;
      }
      if (command === 'disableSubmitBtn') {
        this.newProjectRuning = true;
        return;
      }
      if (command === 'activeNewProject') {
        this.newProjectRuning = false;
        return;
      }
    }
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg);
};
