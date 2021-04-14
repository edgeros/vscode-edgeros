const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
var devicesList = [];
const app = new Vue({
  el: '#app',
  data: () => {
    return {
    };
  },
  filters: {},
  created() {
  },
  watch: {},
  methods: {
    onMessageFn(msg) {}
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