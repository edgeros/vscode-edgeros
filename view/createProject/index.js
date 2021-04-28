const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
const app = new Vue({
  el: '#app',
  data: () => {
    var checkName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nameNotEmptyText));
      } else {
        callback();
      }
    };
    return previousState?.data || {
      templateList: [],
      selectTplName: '',
      loading: false,
      form: {
        name: '',
        bundleid: 'com.example.',
        description: '',
        savePath: '',
        version: '0.0.1',
        vendorId: '',
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        vendorFax: '',
        other: ['openFile']
      },
      rules: {
        name: [
          { required: true, validator: checkName, trigger: 'blur' }
        ]
      }
    };
  },
  filters: {},
  mounted() {
    if (this.templateList.length === 0) { vscode.postMessage({ type: 'getInfoData' }) };
  },
  watch: {
    "form.name": function (value) {
      this.form.bundleid = 'com.example.' + value;
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
        this.loading = false;
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
      this.loading = true;
      this.$refs['form'].validate((valid) => {
        console.log("form", valid)
        if (valid) {
          vscode.postMessage({
            type: 'createProject',
            data: {
              ...this.form,
              tplName: this.selectTplName
            }
          });
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