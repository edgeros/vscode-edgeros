/**
* Copyright (c) 2023 EdgerOS Team.
* All rights reserved.
*
* Detailed license information can be found in the LICENSE file.
*
* Author : Fu Wenhao <fuwenhao@acoinfo.com>
* File   : file.suffix
* Desc   : File description
*/
import * as vscode from 'vscode'
import httpClient from '../utility/httpClient'
import { edgerosWebResources } from '../config'

/**
 * create login bar
 */
export default function createLoginStatusBar (context: vscode.ExtensionContext) {
  const CommandId = 'edgeros.login'

  // registry cmd
  const disposable = vscode.commands.registerCommand(CommandId, (...options: string[]) => {
    vscode.window.showInformationMessage('尚未登陆EdgerOS开发者账号', 'Login', 'Developer').then((selection) => {
      if (selection === 'Login') {
        loginInput()
      } else if (selection === 'Developer') {
        vscode.env.openExternal(vscode.Uri.parse('https://www.edgeros.com/legal/developer'))
      }
    })
  })

  context.subscriptions.push(disposable)

  // show status bar
  const loginStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999)
  loginStatusBarItem.command = CommandId
  loginStatusBarItem.text = '$(edgeros-log) Login'
  loginStatusBarItem.show()

  context.subscriptions.push(loginStatusBarItem)
}

interface LoginData {
  phoneNumber: string;
  phoneCode: string;
}

function loginInput () {
  const loginData: LoginData = {
    phoneNumber: '',
    phoneCode: ''
  }

  const loginInput = vscode.window.createInputBox()
  loginInput.totalSteps = 2
  loginInput.step = 1
  loginInput.placeholder = '请输入手机号'
  loginInput.title = 'EdgerOS 开发者账号登录'
  loginInput.prompt = '登录自动开通 EdgerOS 开发者功能'
  loginInput.show()

  loginInput.onDidAccept(loginHandle.bind(null, loginInput, loginData))
  loginInput.onDidHide(() => { loginInput.dispose() })
}

/**
 * 发送手机验证码
 * @param phoneInput
 * @returns
 */
async function loginHandle (loginInput: vscode.InputBox, loginData: LoginData) {
  try {
    // step1: phone number
    if (loginInput.step === 1) {
      if (!/^1[3-9]\d{9}$/.test(loginInput.value)) {
        loginInput.validationMessage = '请输入正确的手机号码'
        loginInput.show()
        return
      } else {
        loginInput.validationMessage = ''
        loginInput.show()
      }
      loginInput.busy = true
      loginInput.enabled = false

      const res = await httpClient({
        url: edgerosWebResources.loginPhoneNumberSendCode,
        method: 'POST',
        data: {
          phoneNumber: loginInput.value,
          templateCodeId: 8
        }
      })
      if (res.data.status !== 200) {
        throw new Error(' Failed to send the mobile phone verification code ')
      }

      // 切换输入框状态
      loginData.phoneNumber = loginInput.value
      loginInput.busy = false
      loginInput.enabled = true
      loginInput.step = 2
      loginInput.placeholder = '请输入短信验证码'
      loginInput.value = ''
      loginInput.show()
      return
    }

    // step2:phone code
    if (loginInput.step === 2) {
      if (!/^\d{6}$/.test(loginInput.value)) {
        loginInput.validationMessage = '请输入正确的验证码'
        loginInput.show()
        return
      } else {
        loginInput.validationMessage = ''
        loginInput.show()
      }

      loginData.phoneCode = loginInput.value
      loginInput.busy = true
      loginInput.enabled = false
      // todo:开始登录获取信息
      const res = await httpClient({
        url: edgerosWebResources.loginPhoneCodeUserInfo,
        method: 'POST',
        data: {
          agreeDeveloper: true,
          area: 'CN',
          phone: loginData.phoneNumber,
          verificationCode: loginData.phoneCode
        }
      })

      if (res.data.status !== 200) {
        throw new Error('Authentication failure')
      }

      loginInput.hide()
      console.log('----用户身份信息:', res.data.data)
      // todo:本地存储
      // todo:弹出提示框
    }
  } catch (err) {
    console.log('未知错误')
    console.error(err)
  }
}
