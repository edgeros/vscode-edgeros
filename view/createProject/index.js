const vscode = acquireVsCodeApi();
const previousState = vscode.getState();

var tplAll = [
  {
    tempName: "simple",
    description: "You gotta be calm, confident, and you never hesitate.You gotta be calm, confident, and you never hesitate.",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset1.git",
    type: 'Base'
  },
  {
    tempName: "simple1",
    description:
      "模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E6%B5%B7%E8%B4%BC%E7%8E%8B.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset2.git",
    type: 'Ai'
  },
  {
    tempName: "simple2",
    description:
      "模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E6%B5%B7%E8%B4%BC%E7%8E%8B.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset3.git",
    type: 'Ai'
  },
  {
    tempName: "simple3",
    description: "模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E5%8A%A8%E6%BC%AB.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset4.git",
    type: 'Device'
  },
  {
    tempName: "simple",
    description: "模板描述描述描述模板描述描述描述模板描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset5.git",
    type: 'Media'
  },
  {
    tempName: "simple1",
    description:
      "模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E6%B5%B7%E8%B4%BC%E7%8E%8B.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset6.git",
    type: 'Ai'
  },
  {
    tempName: "simple2",
    description:
      "模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E6%B5%B7%E8%B4%BC%E7%8E%8B.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset7.git",
    type: 'Ai'
  },
  {
    tempName: "simple3",
    description: "模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E5%8A%A8%E6%BC%AB.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset8.git",
    type: 'Base'
  },
  {
    tempName: "simple3",
    description: "模板描述描述描述模板描述描述描述模板描述描述描述",
    icon:
      "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/%E5%8A%A8%E6%BC%AB.jpeg",
    gitUrl: "https://gitee.com/fu-wenhao/mrc-asset8.git",
    type: 'Base'
  }
]

var tplTypes = [{
  type: 'All',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
},
{
  type: 'Base',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
}, {
  type: 'Ai',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
}, {
  type: 'Device',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
}, {
  type: 'Media',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
}, {
  type: 'other',
  desc: '模板类型模板类型模板类型模板类型模板类型60个字60个字60个字60个字'
}]


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
      templates: [],
      tplTypes: tplTypes,
      selectTypes: tplTypes[0],
      selectTplName: '',
      plan: "selectTemplate",
      selectTemp: {},
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
    vscode.postMessage({ type: 'getInfoData' });
    this.selectTplType(tplTypes[0]);
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
      this.selectTypes = type;
      this.templates = [];
      let tpls = tplAll.filter((item) => {
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