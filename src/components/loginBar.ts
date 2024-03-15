/* eslint-disable no-unused-vars */
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
      vscode.window.showInformationMessage(`${localize('notLogin.txt', 'Hi, dear developers, come and log in to Edger account to experience more convenient functions!')}`, ...msgBut).then((selection) => {
        if (selection === 'Login') {
          loginInputhandle(context)
        }

        if (selection === 'On not remind') {
          userInfo.alert = false
          setUserInfo(context, userInfo)
        }
      })
    } else {
      vscode.window.showInformationMessage(`${localize('userNickName.txt', 'User nickname:')} ${userInfo.describe.nickname}`, 'Logout').then((selection) => {
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

function loginQuickBox () {
  return new Promise((resolve, reject) => {
    const pickItems: LoginQuickPickItem[] = [{
      label: `$(device-mobile) ${localize('agreeDeveloper.txt', 'Agree to the Developer Agreement')}`,
      quickType: 'agree',
      detail: localize('agreeDeveloperDetail.txt', 'Click to agree to the Developer Agreement')
    }, {
      label: `$(remote-explorer-documentation) ${localize('openDeveloperAgreement.txt', 'Read the Developer Agreement')}`,
      quickType: 'openDoucment',
      detail: '西安翼辉爱智物联技术有限公司（以下简称“本公司”）在此特别提醒使用爱智开发者平台服务的开发者（以下简称“开发者”或“你”）认真阅读、充分理解《翼辉开发者协议》（以下简称“本协议”）各条款'
    }, {
      label: `$(widget-close) ${localize('exit.txt', 'Exit')}`,
      quickType: 'exit'
    }]

    const accreditQuickPick = vscode.window.createQuickPick()
    accreditQuickPick.items = pickItems
    accreditQuickPick.ignoreFocusOut = true
    accreditQuickPick.onDidChangeSelection((pickItemArr: any) => {
      const pickItem = pickItemArr[0]
      if (pickItem.quickType === 'agree') {
        resolve(true)
      } else if (pickItem.quickType === 'openDoucment') {
        vscode.env.openExternal(vscode.Uri.parse(edgerosWebResources.DeveloperAgreement))
      } else if (pickItem.quickType === 'exit') {
        accreditQuickPick.dispose()
        resolve(false)
      }
    })

    accreditQuickPick.onDidHide(() => { accreditQuickPick.dispose() })
    accreditQuickPick.show()
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
  loginInput.title = localize('developerlogin.txt', 'Edger account login')
  loginInput.prompt = localize('authDeveloperlhint.txt', 'User authentication is carried out by receiving verification codes through mobile phones. If your phone number has not been registered yet, the system will automatically register and create an Edger account for you.')
  loginInput.buttons = [{ iconPath: new vscode.ThemeIcon('ports-open-browser-icon') }]

  loginInput.show()

  loginInput.onDidAccept(loginHandle.bind(null, loginInput, loginData, context))
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
        loginInput.validationMessage = localize('phoneNumberError.txt', 'Please enter the correct phone number')
        loginInput.show()
        return
      } else {
        loginInput.validationMessage = ''
        loginInput.show()
      }
      loginInput.busy = true
      loginInput.enabled = false

      // 查看是否签约
      const signStausRes = await httpClient({
        url: edgerosWebResources.cloudApiBase + '/auth/user/developer/sign-status',
        method: 'GET',
        params: {
          phone: loginInput.value
        }
      })

      if (signStausRes.data.status !== 200) {
        throw new Error(' Check whether the signing fails ')
      }

      if (!signStausRes.data.data) {
        const status = await loginQuickBox()
        if (!status) {
          loginInput.dispose()
          return
        }
      }

      // 发送短信
      const res = await httpClient({
        url: edgerosWebResources.cloudApiBase + '/auth/verificationCode',
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
        url: edgerosWebResources.cloudApiBase + '/auth/login/mobile',
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

      vscode.window.showInformationMessage(`${userInfo.describe!.nickname} ${localize('loginSuccess.txt', 'login successful')}`)
    }
  } catch (err: any) {
    vscode.window.showErrorMessage('Edger VSCode :' + err.message)
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
