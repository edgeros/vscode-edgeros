const vscode = acquireVsCodeApi();
const previousState = vscode.getState();

const app = new Vue({
  el: '#app',
  data: () => {
    return {
      form: {
        devIp: previousState ? previousState.form.devIp : '',
        devName: previousState ? previousState.form.devName : '',
        devPwd: previousState ? previousState.form.devPwd : ''
      }
    };
  },
  filters: {},
  created() {
  },
  watch: {
    "form.devIp": function () {
      vscode.setState({ form: this.form });
    },
    "form.devName": function () {
      vscode.setState({ form: this.form });
    },
    "form.devPwd": function () {
      vscode.setState({ form: this.form });
    }
  },
  methods: {
    onSubmit() {
      let cmdData = {
        type: 'addDev',
        data: {
          ...this.form
        }
      };
      vscode.postMessage(cmdData);
    }
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg);
};