const vscode = acquireVsCodeApi()
const previousState = vscode.getState()
const app = new Vue({
  el: '#app',
  filters: {},
  data: () => {
    const checkName = (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error(nlsMessages.nameNotEmptyText))
      }
      if (/^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9\s_\-~#@]+$/g.test(value)) {
        callback()
      } else {
        callback(new Error(nlsMessages.nameIncorrectFormatText))
      }
    }

    const checkBundleId = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.bundleIdNotEmptyText))
      }
      if (/^[a-z]([a-z0-9-]*)(\.([a-z0-9-]+)){2,}$/g.test(value)) {
        callback()
      } else {
        callback(new Error(nlsMessages.bundleIdIncorrectFormatText))
      }
    }

    const checkVersion = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.versionNotEmptyText))
      }
      if (/^([1-9]\d*|0)(\.(([1-9]\d*)|0)){2}$/.test(value)) {
        callback()
      } else {
        callback(new Error(nlsMessages.versionIncorrectFormatText))
      }
    }

    const checkVendorId = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.vendorIdNotEmptyText))
      }
      if (/^[0-9a-zA-Z_-]{1,40}$/g.test(value)) {
        callback()
      } else {
        callback(new Error(nlsMessages.vendorIdIncorrectFormatText))
      }
    }

    const checkVendorName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.vendorNameNotEmptyText))
      } else {
        callback()
      }
    }

    const checkEmail = (rule, value, callback) => {
      if (!value) {
        return callback(new Error(nlsMessages.emailNotEmptyText))
      }
      // https://regex101.com/r/mX1xW0/1
      const regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
      if (!regex.test(value)) {
        return callback(new Error(nlsMessages.invalidEmailText))
      } else {
        callback()
      }
    }

    const checkPhone = (rule, value, callback) => {
      if (value) {
        const regex = /^1[3456789]\d{9}$/i
        if (!regex.test(value)) {
          return callback(new Error(nlsMessages.invalidPhoneText))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }

    const checkFax = (rule, value, callback) => {
      if (value) {
        const regex = /^(?:\d{3,4}-)?\d{7,8}(?:-\d{1,6})?$/i
        if (!regex.test(value)) {
          return callback(new Error(nlsMessages.invalidFaxText))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }

    return (
      previousState?.data || {
        templateAll: [], // ??????????????????
        templates: [], // ??????????????????????????????
        selectTemp: {}, // ????????????
        tplTypes: [], // ????????????
        selectType: {}, // ?????????????????????????????????
        plan: 'selectTemplate',
        loading: false,
        refreshTplStatus: true,
        form: {
          name: '',
          bundleId: 'com.example.',
          description: '',
          savePath: '',
          version: '0.0.1',
          vendorId: '',
          vendorName: '',
          vendorEmail: '',
          vendorPhone: '',
          vendorFax: '',
          other: ['openFile']
        },
        rules: {
          name: [{ required: true, validator: checkName, trigger: 'blur' }],
          bundleId: [
            { required: true, validator: checkBundleId, trigger: 'blur' }
          ],
          version: [
            { required: true, validator: checkVersion, trigger: 'blur' }
          ],
          vendorId: [
            { required: true, validator: checkVendorId, trigger: 'blur' }
          ],
          vendorName: [
            { required: true, validator: checkVendorName, trigger: 'blur' }
          ],
          vendorEmail: [
            { required: true, validator: checkEmail, trigger: 'blur' }
          ],
          vendorPhone: [
            { required: false, validator: checkPhone, trigger: 'blur' }
          ],
          vendorFax: [
            { required: false, validator: checkFax, trigger: 'blur' }
          ]
        },
        // eslint-disable-next-line no-undef
        imageTemplateSource: imagesCreatePro.imageTemplateSource[0],
        // eslint-disable-next-line no-undef
        imageProviderIdSource: imagesCreatePro.imageProviderIdSource[0],
        // ???????????? ?????????
        sizePadding: 32
      }
    )
  },
  watch: {
    'form.vendorId': function (value) {
      this.form.vendorId = value.trim()
    },
    'form.vendorEmail': function (value) {
      this.form.vendorEmail = value.trim()
    },
    'form.bundleId': function (value) {
      this.form.bundleId = value.trim()
    },
    'form.version': function (value) {
      this.form.version = value.trim()
    },
    'form.vendorName': function (value) {
      this.form.vendorName = value.trim()
    }
  },
  mounted () {
    if (this.templateAll.length === 0) {
      vscode.postMessage({ type: 'getInfoData' })
    }
    // ??????????????????
    this.$nextTick(() => {
      this.paddingChange()
    })
    // ????????????????????????
    setTimeout(() => {
      this.$nextTick(() => {
        this.paddingChange()
      })
    }, 300)
  },
  created () { },
  methods: {
    inputChange (value) {
      vscode.setState({
        data: this.$data
      })
    },
    refreshTpl () {
      vscode.postMessage({ type: 'getInfoData', refresh: true })
      this.refreshTplStatus = true
    },
    onMessageFn (msg) {
      if (msg.type === '_selectSavePath') {
        this.form.savePath = msg.data
        this.inputChange()
      } else if (msg.type === '_getInfoData') {
        this.form.savePath = msg.data.defaultSavePath
        this.templateAll = msg.data.templates
        this.tplTypes = msg.data.templateTypes
        if (msg.data.incloud) {
          this.refreshTplStatus = false
        }
        this.selectTplType(this.tplTypes[0])
        this.inputChange()
      } else if (msg.type === '_createProject') {
        this.loading = false
      }
    },
    selectSavePath () {
      vscode.postMessage({
        type: 'selectSavePath'
      })
    },
    // ??????????????????
    selectTplType (type) {
      this.selectType = type
      this.templates = []
      const tpls = this.templateAll.filter(item => {
        return item.type === type.type || type.type === 'all'
      })
      this.templates = tpls
      // let items = []
      // for (let i = 0; i < tpls.length; i++) {
      //   items.push(tpls[i])
      //   if (items.length === 4) {
      //     this.templates.push(items)
      //     items = []
      //   }
      // }
      // if (items.length > 0) {
      //   this.templates.push(items)
      // }
      this.inputChange()
    },
    // ????????????
    selectTpl (item) {
      this.selectTemp = item
      this.plan = 'enterDetails'
      this.selectType = this.tplTypes.find(typeItem => {
        return typeItem.type === item.type
      })
      this.inputChange()
    },
    // ??????????????????
    backTpl () {
      this.plan = 'selectTemplate'
      this.inputChange()
    },
    // ??????????????????
    onSubmit () {
      this.$refs.form.validate(valid => {
        this.form.name = this.form.name.trim()
        if (valid) {
          this.loading = true
          vscode.postMessage({
            type: 'createProject',
            data: {
              ...this.form,
              tplData: this.selectTemp
            }
          })
        }
      })
    },
    paddingChange () {
      const padNum = this.$refs.cardContainer.scrollWidth % 198
      const paddingUn = parseInt((padNum - 10) / 2)
      this.sizePadding = paddingUn
    }
  }
})
// ??????????????????
app.$on('onmessage', function (msg) {
  this.onMessageFn(msg)
})
window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data)
}

// ??????????????????????????????
app.$on('paddingChange', function (msg) {
  this.paddingChange(msg)
})
window.onresize = function () {
  app.$emit('paddingChange')
}
