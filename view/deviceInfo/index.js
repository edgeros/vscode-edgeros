const vscode = acquireVsCodeApi()
const previousState = vscode.getState()

let devicesList = []
let devForm = {}

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
        return (item.devName === value && item.devId !== devForm.devId)
      })
      if (devItem) {
        callback(new Error(nlsMessages.devNameExistText))
      } else {
        callback()
      }
    }

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
        ]
      }
    }
  },
  created () {
    vscode.postMessage({ type: 'getDeviceData' })
  },
  methods: {
    inputChange () {
      vscode.setState({ data: this.$data })
    },
    onUpdate () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          vscode.postMessage({
            type: 'update',
            data: {
              ...this.form
            }
          })
        }
      })
    },
    onDelete () {
      this.$confirm(nlsMessages.devDeleteHintContextText, nlsMessages.devDeleteHintTitleText, {
        confirmButtonText: nlsMessages.devDeleteHintYesButtonText,
        cancelButtonText: nlsMessages.devDeleteHintNoButtonText,
        type: 'warning'
      }).then(() => {
        vscode.postMessage({
          type: 'delete',
          data: {
            ...this.form
          }
        })
      })
    },
    onMessageFn (msg) {
      if (!this.form.devIp && msg.type === '_getDeviceData') {
        this.form = msg.data.deviceInfo
        devForm = msg.data.deviceInfo
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
