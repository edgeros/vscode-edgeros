const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
const app = new Vue({
  el: '#app',
  data: () => {
    return previousState?.data || {
      templateList: [],
      selectTplName: '',
      form: {
        name: '',
        bundleid: 'com.edgeros.',
        description: '',
        savePath: '',
        version: '0.0.1',
        vendorId: '',
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        vendorFax: '',
        other: []
      }
    };
  },
  filters: {},
  created() {
  },
  mounted() {
    if (this.templateList.length === 0) { vscode.postMessage({ type: 'getInfoData' }) };
  },
  watch: {
    "form.name": function (value) {
      this.form.bundleid = 'com.edgeros.' + value;
    }
  },
  methods: {
    inputChange(value) {
      vscode.setState({
        data: this.$data,
      });
    },
    onMessageFn(msg) {
      if (msg.type === '_selectSavePath') {
        this.form.savePath = msg.data;
        this.inputChange();
      } else if (msg.type === '_getInfoData') {
        this.form.savePath = msg.data.defaultSavePath;
        this.templateList = msg.data.templateList;
        this.selectTplName = this.templateList[0].tplName;
        this.inputChange();
      } else if (msg.type === '_createProject') {
        if (msg.data === 'success') {
          console.log('>>>>>创建成功');
        } else {
          console.log('>>>>创建失败');
        }
      }
    },
    selectSavePath() {
      vscode.postMessage({
        type: 'selectSavePath'
      });
    },
    selectTpl(item) {
      this.selectTplName = item.tplName;
      this.inputChange();
    },
    onSubmit() {
      vscode.postMessage({
        type: 'createProject',
        data: {
          ...this.form,
          tplName: this.selectTplName
        }
      });
    }
  },
  created() {
  },
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data);
};