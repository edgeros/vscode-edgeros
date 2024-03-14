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
import { nlsConfig } from '../nls'

import httpClient from '../utility/httpClient'
import { edgerosWebResources, edgerosGlobalUserInfoKey } from '../config'

const localize = nlsConfig(__filename)

interface LoginData {
  phoneNumber: string;
  phoneCode: string;
}

interface UserInfo {
  alert: boolean // 用于网页前端是否提醒用户未登录
  describe: {
    id: number,
    acoid: string,
    username: string,
    phone: string,
    email: string,
    accessToken: string,
    refreshToken: string,
    profile: string,
    nickname: string,
    jti: string,
    deviceId: string | null,
    registered: boolean,
    expiresIn: number,
    developer: {
      status: number,
      certifyId: string | null,
      activeAt: string,
      certifiedAt: string | null,
      signExpire: 31536000,
      certifyExpire: string | null,
      vendorId: string,
      deviceVendorName: string | null,
      deviceVendorId: string | null,
      deviceVendorStatus: number
    }
  } | null
}

/**
 * create login bar
 */
export default function createLoginStatusBar (context: vscode.ExtensionContext) {
  const CommandId = 'edgeros.login'

  // registry cmd
  const disposable = vscode.commands.registerCommand(CommandId, (...options: string[]) => {
    const userInfo = getUserInfo(context)
    if (userInfo.describe === null) {
      vscode.window.showInformationMessage(`${localize('notLogin.txt', 'Not logged into EdgerOS developer account yet')}`, 'Login', 'Developer Agreement').then((selection) => {
        if (selection === 'Login') {
          loginInput(context)
        } else if (selection === 'Developer Agreement') {
          vscode.env.openExternal(vscode.Uri.parse('https://www.edgeros.com/legal/developer'))
        }
      })
    } else {
      vscode.window.showInformationMessage(`${localize('userInfo.txt', 'User information')}:${userInfo.describe.nickname}`, 'Logout').then((selection) => {
        if (selection === 'Logout') {
          setUserInfo(context, {
            alert: true,
            describe: null
          })
        }
      })
    }
  })

  context.subscriptions.push(disposable)

  // show status bar
  const loginStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999)
  loginStatusBarItem.command = CommandId
  loginStatusBarItem.text = '$(edgeros-logo)'
  loginStatusBarItem.show()

  context.subscriptions.push(loginStatusBarItem)

  // init UserInfo
  const userInfo = getUserInfo(context)
  if (userInfo === undefined) {
    setUserInfo(context, {
      alert: true,
      describe: null
    })
  }
}

function loginInput (context: vscode.ExtensionContext) {
  const loginData: LoginData = {
    phoneNumber: '',
    phoneCode: ''
  }

  const loginInput = vscode.window.createInputBox()
  loginInput.totalSteps = 2
  loginInput.step = 1
  loginInput.placeholder = localize('inputPhoneNumber.txt', 'Please enter your phone number')
  loginInput.title = localize('developerlogin.txt', 'EdgerOS Developer account login')
  loginInput.prompt = localize('authDeveloperlhint.txt', 'The EdgerOS developer function is automatically opened after login')
  loginInput.show()

  loginInput.onDidAccept(loginHandle.bind(null, loginInput, loginData, context))
  loginInput.onDidHide(() => { loginInput.dispose() })
}

/**
 * 发送手机验证码
 * @param phoneInput
 * @returns
 */
async function loginHandle (loginInput: vscode.InputBox, loginData: LoginData, context: vscode.ExtensionContext) {
  try {
    // step1: phone number
    if (loginInput.step === 1) {
      if (!/^1[3-9]\d{9}$/.test(loginInput.value)) {
        loginInput.validationMessage = localize('phoneNumberError.txt', 'Please enter the correct mobile number')
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
      loginInput.placeholder = localize('inputPhoneCode.txt', 'Please enter the SMS verification code')
      loginInput.value = ''
      loginInput.show()
      return
    }

    // step2:phone code
    if (loginInput.step === 2) {
      if (!/^\d{6}$/.test(loginInput.value)) {
        loginInput.validationMessage = localize('phoneCodeError.txt', 'Please enter the correct verification code')
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

      if (res.data.status !== 200) { throw new Error('Authentication failure') }
      loginInput.hide()
      const userInfo = getUserInfo(context)
      userInfo.describe = res.data.data
      setUserInfo(context, userInfo)

      vscode.window.showInformationMessage(`EdgerOS:${userInfo.describe!.nickname} ${localize('loginSuccess.txt', 'Login successful')}`)
    }
  } catch (err: any) {
    vscode.window.showErrorMessage('EdgerOS:' + err.message)
  }
}

/**
 * 设置用户信息
 */
export function setUserInfo (context: vscode.ExtensionContext, userInfo: UserInfo | undefined) {
  context.globalState.update(edgerosGlobalUserInfoKey, userInfo)
}

/**
 * 获取用户信息
 */
export function getUserInfo (context: vscode.ExtensionContext): UserInfo {
  const userInfo = context.globalState.get(edgerosGlobalUserInfoKey) as UserInfo
  return userInfo
}
