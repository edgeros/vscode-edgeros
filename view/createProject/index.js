const vscode = acquireVsCodeApi()
const previousState = vscode.getState()

const app = new Vue({
  el: '#app',
  filters: {},
  data: () => {
    const checkName = (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error(nlsMessages.nameNotEmptyText))
      } else {
        callback()
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
      // https://regex101.com/r/mX1xW0/1
      const regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
      if (value && !regex.test(value)) {
        return callback(new Error(nlsMessages.invalidEmailText))
      } else {
        callback()
      }
    }

    const checkPhone = (rule, value, callback) => {
      // https://regex101.com/r/wZ4uU6/1
      const regex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/
      if (value && !regex.test(value)) {
        return callback(new Error(nlsMessages.invalidPhoneText))
      } else {
        callback()
      }
    }

    return previousState?.data || {
      templateAll: [], // 所有模板信息
      templates: [], // 根据类型筛选模板列表
      selectTemp: {}, // 选择模板
      tplTypes: [], // 模板类型
      selectType: {}, // 根据模板类型选择的模板
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
        name: [
          { required: true, validator: checkName, trigger: 'blur' }
        ],
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
          { required: false, validator: checkEmail, trigger: 'blur' }
        ],
        vendorPhone: [
          { required: false, validator: checkPhone, trigger: 'blur' }
        ],
        vendorFax: [
          { required: false, validator: checkPhone, trigger: 'blur' }
        ]
      }
    }
  },
  mounted () {
    if (this.templateAll.length === 0) vscode.postMessage({ type: 'getInfoData' })
  },
  created () {
  },
  methods: {
    inputChange (value) {
      vscode.setState({
        data: this.$data
      })
    },
    refreshTpl () {
      vscode.postMessage({ type: 'getInfoData' })
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
    // 选择模板类型
    selectTplType (type) {
      this.selectType = type
      this.templates = []
      const tpls = this.templateAll.filter((item) => {
        return item.type === type.type || type.type === 'All'
      })
      let items = []
      for (let i = 0; i < tpls.length; i++) {
        items.push(tpls[i])
        if (items.length === 4) {
          this.templates.push(items)
          items = []
        }
      }
      if (items.length > 0) {
        this.templates.push(items)
      }
      this.inputChange()
    },
    // 选择模板
    selectTpl (item) {
      this.selectTemp = item
      this.plan = 'enterDetails'
      this.selectType = this.tplTypes.find(typeItem => {
        return typeItem.type === item.type
      })
      this.inputChange()
    },
    // 返回模板选择
    backTpl () {
      this.plan = 'selectTemplate'
      this.inputChange()
    },
    // 提交创建项目
    onSubmit () {
      this.$refs.form.validate((valid) => {
        console.log('form', valid)
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
    }
  }
})
app.$on('onmessage', function (msg) {
  this.onMessageFn(msg)
})

window.onmessage = function (msg) {
  app.$emit('onmessage', msg.data)
}
