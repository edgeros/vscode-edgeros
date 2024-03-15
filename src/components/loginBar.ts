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

export interface UserInfo {
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

let userInfoUpdateCallBack: Function | null = null
/**
 * create login bar
 */
export default function createLoginStatusBar (context: vscode.ExtensionContext) {
  const CommandId = 'edgeros.login'

  // registry cmd
  const disposable = vscode.commands.registerCommand(CommandId, (...options: string[]) => {
    const exeModel = options[0] // 触发方式目前有两种: 创建项目页:createProView  点击爱智图标:loginBar

    const msgBut = []
    if (exeModel === 'createProView') {
      msgBut.push('Login')
      msgBut.push('On not remind')
    } else {
      msgBut.push('Login')
    }

    const userInfo = getUserInfo(context)
    if (userInfo.describe === null) {
      vscode.window.showInformationMessage(`${localize('notLogin.txt', 'Hi, dear developers, logging in to the EdgerOS account in the plugin can help you quickly replenish your developer information when creating a project.')}`, ...msgBut).then((selection) => {
        if (selection === 'Login') {
          loginQuickBox(context)
        }

        if (selection === 'On not remind') {
          userInfo.alert = false
          setUserInfo(context, userInfo)
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
  loginStatusBarItem.command = {
    command: CommandId,
    title: 'EdgerOS User',
    arguments: ['loginBar']
  }
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

/**
 * 登录快速选择框
 */
interface LoginQuickPickItem extends vscode.QuickPickItem {
  quickType: string,
}

function loginQuickBox (context: vscode.ExtensionContext) {
  const pickItems: LoginQuickPickItem[] = [{
    label: `$(device-mobile) ${localize('phoneNumberLogin.txt', 'Use your mobile number to log in or register')}`,
    quickType: 'login',
    detail: localize('phoneNumberLoginDetail.txt', 'Use your mobile number to log in or register')
  }, {
    label: `$(remote-explorer-documentation) ${localize('openDeveloperAgreement.txt', 'View Developer Agreement')}`,
    quickType: 'openDoucment',
    detail: '西安翼辉爱智物联技术有限公司（以下简称“本公司”）在此特别提醒使用爱智开发者平台服务的开发者（以下简称“开发者”或“你”）认真阅读、充分理解《翼辉开发者协议》（以下简称“本协议”）各条款',
    buttons: [{
      iconPath: new vscode.ThemeIcon('gist-new')
    }]
  }]

  vscode.window.showQuickPick(pickItems).then((pickItem: LoginQuickPickItem | undefined) => {
    if (!pickItem) return

    if (pickItem.quickType === 'login') {
      loginInputhandle(context)
    } else if (pickItem.quickType === 'openDoucment') {
      vscode.env.openExternal(vscode.Uri.parse(edgerosWebResources.DeveloperAgreement))
    }
  })
}

/**
 * 执行登录输入手机密码操作
 * @param context
 */
function loginInputhandle (context: vscode.ExtensionContext) {
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
  loginInput.buttons = [{ iconPath: new vscode.ThemeIcon('ports-open-browser-icon') }]

  loginInput.show()

  loginInput.onDidAccept(loginHandle.bind(null, loginInput, loginData, context))
  loginInput.onDidHide(() => { loginInput.dispose() })
  loginInput.onDidTriggerButton(() => { vscode.env.openExternal(vscode.Uri.parse(edgerosWebResources.DeveloperAgreement)) })
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

      if (userInfoUpdateCallBack) userInfoUpdateCallBack(userInfo)

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

/**
 * 设置用户更新回调函数
 */
export function setUserInfoUpdateCallBack (cb: Function) {
  userInfoUpdateCallBack = cb
}
