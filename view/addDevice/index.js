const vscode = acquireVsCodeApi();
const previousState = vscode.getState();

const app = new Vue({
  el: '#app',
  data: () => {
    return {
      form: {
        devIp: previousState ? previousState.form.devIp : '',
        devName: previousState ? previousState.form.devName : '',
        pwd: previousState ? previousState.form.pwd : ''
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
    "form.pwd": function () {
      vscode.setState({ form: this.form });
    }
  },
  methods: {
    onSubmit() {
      vscode.postMessage(this.form);
    }
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg);
};