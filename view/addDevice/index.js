const vscode = acquireVsCodeApi()
const previousState = vscode.getState()

let devicesList = []

const app = new Vue({
  el: '#app',
  filters: {},
  data: () => {
    const checkDevIp = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.ipNotEmptyText))
      }
      if (/^\d+\.\d+\.\d+\.\d+$/g.test(value)) {
        callback()
      } else {
        callback(new Error(nlsMessages.ipIncorrectFormatText))
      }
    }

    const checkDevName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.devNameNotEmptyText))
      }
      const devItem = devicesList.find(item => {
        return item.devName === value
      })
      if (devItem) {
        callback(new Error(nlsMessages.devNameExistText))
      } else {
        callback()
      }
    }

    return previousState?.data || {
      form: {
        devId: '', // auto generate
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
        ]
      }
    }
  },
  watch: {
  },
  created () {
    vscode.postMessage({ type: 'getDeviceData' })
  },
  methods: {
    inputChange () {
      vscode.setState({ data: this.$data })
    },
    onAddDevice () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.form.devId = (new Date()).getTime()
          const cmdData = {
            type: 'addDev',
            data: {
              ...this.form
            }
          }
          vscode.postMessage(cmdData)
        }
      })
    },
    onMessageFn (msg) {
      if (!this.form.devIp && msg.type === '_getDeviceData') {
        devicesList = msg.data.devices
      }
    }
  }
})
app.$on('onmessage', function (msg) {
  this.onMessageFn(msg)
})

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data)
}
