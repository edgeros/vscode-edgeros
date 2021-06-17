const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
var devicesList = [];
var devForm = {};
const app = new Vue({
  el: '#app',
  data: () => {
    var checkDevIp = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(ipNotEmptyText));
      }
      if (/^\d+\.\d+\.\d+\.\d+$/g.test(value)) {
        callback();
      } else {
        callback(new Error(ipIncorrectFormatText));
      }
    };

    var checkDevName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(devNameNotEmptyText));
      }
      let devItem = devicesList.find(item => {
        return (item.devName === value && item.devId != devForm.devId);
      });
      if (devItem) {
        callback(new Error(devNameExistText));
      } else {
        callback();
      }
    };

    return previousState?.data || {
      form: {
        devId: '',
        devIp: '',
        devName: '',
        devPwd: ''
      },
      devices: [],
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
  methods: {
    inputChange() {
      vscode.setState({ data: this.$data });
    },
    onUpdate() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          vscode.postMessage({
            type: 'update',
            data: {
              ...this.form,
            }
          });
        }
      });
    },
    onDelete() {
      this.$confirm(devDeleteHintContextText, devDeleteHintTitleText, {
        confirmButtonText: devDeleteHintYesButtonText,
        cancelButtonText: devDeleteHintNoButtonText,
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
        this.form = msg.data.deviceInfo;
        devForm = msg.data.deviceInfo;
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