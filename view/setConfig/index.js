const vscode = acquireVsCodeApi();
const previousState = vscode.getState();

const app = new Vue({
  el: '#app',
  data: () => {
    return previousState?.data || {
      buildSuffix: "eap",
      increment: "yes"
    };
  },
  filters: {},
  watch: {

  },
  methods: {
    selectChange() {
      vscode.setState({ data: this.$data });
      vscode.postMessage({
        type: 'update',
        data: this.$data
      })
    },
    onMessageFn(msg) {
      if (msg.type == '_getConfig') {
        this.buildSuffix = msg.data.buildSuffix
        this.increment = msg.data.increment
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