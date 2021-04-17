const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
const app = new Vue({
  el: '#app',
  data: () => {
    return previousState?.data || {
      templateList: [
        {
          tplName: "simple1",
          imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
        },
        {
          tplName: "simple2",
          imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
        },
        {
          tplName: "simple3",
          imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
        },
        {
          tplName: "simple4",
          imageSrc: "https://gitee.com/fu-wenhao/mrc-asset/raw/master/media/edgeros_logo.png",
        }
      ],
      selectTmp: '',
      form: {
        name: '',
        bundleid: 'com.edgeros.',
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
    this.selectTmp = this.selectTmp || this.templateList[0].tplName;
  },
  watch: {
    "form.name": function (value) {
      this.form.bundleid = 'com.edgeros.' + value;
    }
  },
  methods: {
    inputChange(value) {
      vscode.setState({ data: this.$data });
    },
    onMessageFn(msg) {
      if (msg.type === '_selectSavePath') {
        this.form.savePath = msg.data;
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
      this.selectTmp = item.tplName;
      this.inputChange();
    },
    onSubmit() {
      vscode.postMessage({
        type: 'createProject',
        data: {
          ...this.form
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