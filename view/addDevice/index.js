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
        return item.devIp === value;
      });
      if (devItem) {
        callback(new Error('存在相同名称设备'));
      } else {
        callback();
      }
    };

    return {
      viewType: previousState ? previousState.data.viewType : 'add',//update
      form: {
        devIp: previousState ? previousState.data.form.devIp : '',
        devName: previousState ? previousState.data.form.devName : '',
        devPwd: previousState ? previousState.data.form.devPwd : ''
      },
      devices: previousState ? previousState.data.devices : [],
      rules: {
        devIp: [
          { required: true, validator: checkDevIp, trigger: 'blur' }
        ],
        devName: [
          { required: true, validator: checkDevName, trigger: 'blur' }
        ],
      }
    };
  },
  filters: {},
  created() {
  },
  watch: {
    "form.devIp": function () {
      vscode.setState({ data: this.$data });
    },
    "form.devName": function () {
      vscode.setState({ data: this.$data });
    },
    "form.devPwd": function () {
      vscode.setState({ data: this.$data });
    },
    "devices": function () {
      vscode.setState({ data: this.$data });
    },
    "viewType": function () {
      vscode.setState({ data: this.$data });
    }
  },
  methods: {
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
    onUpdate() {
      vscode.postMessage({
        type: 'update',
        data: {
          ...this.form,
        }
      });
    },
    onDelete() {
      this.$confirm('此操作将永久删除该设备, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        vscode.postMessage({
          type: 'delete',
          data: {
            ...this.form,
          }
        });
      });

    },
    onMessageFn(msg) {
      if (!this.form.devIp && msg.type === '_getDeviceData') {
        if (msg.data.deviceInfo) {
          this.viewType = 'update';
          this.form = msg.data.deviceInfo;
        }
        devicesList = msg.data.devices;
      }
    }
  },
  created() {
    vscode.postMessage({ type: 'getDeviceData' });
  },
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data);
};