const vscode = acquireVsCodeApi();

const app = new Vue({
  el: '#app',
  data: () => {
    return {
      title: 'isZe EgerOS device Page',
      visible: false
    };
  },
  filters: {},
  created() {
  },
  watch: {
  },
  methods: {
    test: function (type) {
      this.selectType = type;
      vscode.setState({ data: this.$data });
    },
    onMessageFn: function (event) {
      console.log('pugin send Message', event);
    },
    show: function () {
      this.visible = true;
    }
  }
});
app.$on("onmessage", function (msg) {
  this.onMessageFn(msg);
});

window.onmessage = function (msg) {
  app.$emit('onmessage', msg);
};