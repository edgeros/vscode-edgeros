const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
var devicesList = [];
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
        return item.devName === value;
      });
      if (devItem) {
        callback(new Error(devNameExistText));
      } else {
        callback();
      }
    };

    return previousState?.data || {
      form: {
        devId: '',//auto generate
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
  watch: {
  },
  methods: {
    inputChange() {
      vscode.setState({ data: this.$data });
    },
    onAddDevice() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          this.form.devId = (new Date()).getTime()
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