const vscode = acquireVsCodeApi();
const previousState = vscode.getState();

const app = new Vue({
  el: '#app',
  data: () => {
    return previousState?.data || {
      type: "1",
      version: "1"
    };
  },
  filters: {},
  watch: {

  },
  methods: {
    inputChange() {
      vscode.setState({ data: this.$data });
    },
    onMessageFn(msg) {
      if (!this.form.devIp && msg.type === '_getConfig') {
      }
    }
  },
  created() {
    vscode.postMessage({ type: 'getConfig' });
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data);
};