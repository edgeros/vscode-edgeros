const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
var devicesList = [];
const app = new Vue({
  el: '#app',
  data: () => {

    var checkDevIp = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('ip不能为空'));
      }
      if (/^\d+\.\d+\.\d+\.\d+$/g.test(value)) {
        let devItem = devicesList.find(item => {
          return item.devIp === value;
        });
        if (devItem) {
          callback(new Error('已存在相同IP设备'));
        } else {
          callback();
        }
      } else {
        callback(new Error('请输入正确IP地址'));
      }
    };

    var checkDevName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('设备名不能为空'));
      }
      let devItem = devicesList.find(item => {
        return item.devName === value;
      });
      if (devItem) {
        callback(new Error('存在相同名称设备'));
      } else {
        callback();
      }
    };

    return previousState?.data || {
      viewType: 'add',
    };
  },
  filters: {},
  watch: {
  },
  methods: {
    inputChange() {
      vscode.setState({ data: this.$data });
    },
    onAddDevice() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          let cmdData = {
            type: 'addDev',
            data: {
              ...this.form
            }
          };
          vscode.postMessage(cmdData);
        }
      });
    },
    onMessageFn(msg) {
      if (!this.form.devIp && msg.type === '_getDeviceData') {
        devicesList = msg.data.devices;
      }
    }
  },
  created() {
    vscode.postMessage({ type: 'getDeviceData' });
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data);
};