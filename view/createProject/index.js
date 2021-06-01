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

    var checkBundleId = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(bundleIdNotEmptyText));
      }
      if (/^[a-z]([a-z0-9-]*)(\.([a-z0-9-]+)){2,}$/g.test(value)) {
        callback();
      } else {
        callback(new Error(bundleIdIncorrectFormatText));
      }
    }

    var checkVersionId = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(versionIdNotEmptyText));
      }
      if (/^\d+$/g.test(value)) {
        callback();
      } else {
        callback(new Error(versionIdIncorrectFormatText));
      }
    }

    return previousState?.data || {
      templateAll: [],//所有模板信息
      templates: [], //根据类型筛选模板列表
      selectTemp: {}, // 选择模板
      tplTypes: [],//模板类型
      selectType: {},//根据模板类型选择的模板
      plan: "selectTemplate",
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
        ],
        vendorName: [
          { required: true, validator: checkName, trigger: 'blur' }
        ],
        bundleid: [
          { required: true, validator: checkBundleId, trigger: 'blur' }
        ],
        vendorId: [
          { required: true, validator: checkVersionId, trigger: 'blur' }
        ]
      }
    };
  },
  filters: {},
  mounted() {
    if (this.templateAll.length == 0) vscode.postMessage({ type: 'getInfoData' });
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
        this.templateAll = msg.data.templates;
        this.tplTypes = msg.data.templateTypes;
        this.selectTplType(this.tplTypes[0]);
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
    // 选择模板类型
    selectTplType(type) {
      this.selectType = type;
      this.templates = [];
      let tpls = this.templateAll.filter((item) => {
        return item.type === type.type || type.type == 'All'
      })
      let items = [];
      for (let i = 0; i < tpls.length; i++) {
        items.push(tpls[i]);
        if (items.length == 4) {
          this.templates.push(items);
          items = [];
        }
      }
      if (items.length > 0) {
        this.templates.push(items);
      }
      this.inputChange();
    },
    // 选择模板
    selectTpl(item) {
      this.selectTemp = item;
      this.plan = "enterDetails";
      this.selectType = this.tplTypes.find(typeItem => {
        return typeItem.type == item.type
      })
      this.inputChange();
    },
    // 返回模板选择
    backTpl() {
      this.plan = "selectTemplate";
      this.inputChange();
    },
    // 提交创建项目
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        console.log("form", valid)
        if (valid) {
          this.loading = true;
          vscode.postMessage({
            type: 'createProject',
            data: {
              ...this.form,
              tplData: this.selectTemp
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