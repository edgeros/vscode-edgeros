const vscode = acquireVsCodeApi();

const app = new Vue({
  el: '#app',
  data: () => {
    return {
      form: {
        devIp: '',
        devName: '',
        pwd: ''
      }
    };
  },
  filters: {},
  created() {
  },
  watch: {
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