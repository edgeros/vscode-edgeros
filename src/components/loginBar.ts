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
import { edgerosWebResources, edgerosGlobalUserInfoKey } from '../config'

interface LoginData {
  phoneNumber: string;
  phoneCode: string;
}

interface UserInfo {
  id: 239992,
  acoid: '239992',
  username: 'fuwenhao',
  phone: '18616610153',
  email: '495235118@qq.com',
  accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYV8yNSJ9.eyJwaG9uZSI6IjE4NjE2NjEwMTUzIiwidXNlcm5hbWUiOiJmdXdlbmhhbyIsInNjb3BlIjpbImFsbCJdLCJwcm9maWxlIjoiaHR0cHM6Ly9kZXYtY2xvdWQtZWRnZXJvcy5vc3MtY24taGFuZ3pob3UuYWxpeXVuY3MuY29tL2VkZ2Vyb3MtcHVibGljLXJlc291cmNlLzU3ZTYyYTk3LWY5MGEtNDNjNi1hNWQwLTdhMjY1NzhiMzFhMy5qcGciLCJuaWNrbmFtZSI6IjE4NioqKiowMTUzIiwiZXhwIjoxNzEwMzk1MjM3LCJhY29pZCI6IjIzOTk5MiIsImp0aSI6IjM4YmFmZDE3LTVmNTUtNGIxZS04MjFmLTI4YmY5ZGMyOTIyYiIsImVtYWlsIjoiNDk1MjM1MTE4QHFxLmNvbSIsImNsaWVudF9pZCI6ImFjb2luZm9fdmlwIiwidXNlcm5hbWUiOiJmdXdlbmhhbyJ9.kikItZaS_MiUYUeHiegJAyeWGIJC3ab_aPiTyDhQjIVcGcJop798eSs_3kQfMdNiA7rDOigPkUF1WFOZEm9E3tSesod-Dd35MULOJw-yuTE6Xady9_e8Vkkm3Lpv12vhUCrIiWh5D6dulecK3gTlLdAmvMu4OZjv8t5v3c3yI5c-I4e_5dIPYEl_kWJJisbTLes46shTufZnupHG58Ov85ONgvZyKK-Nu18cVhSm6pEz4KHiACHFOLp3gdG_nnbSud0PvDzHc9gh4hiRkZFE7BdsZAKxcMRbqc5SkHZiSCB1nwkwTDx-_6bshPGWsfMLVV1iLCa6UwD1EN_8O2MQ4Q',
  refreshToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYV8yNSJ9.eyJwaG9uZSI6IjE4NjE2NjEwMTUzIiwidXNlcm5hbWUiOiJmdXdlbmhhbyIsInNjb3BlIjpbImFsbCJdLCJwcm9maWxlIjoiaHR0cHM6Ly9kZXYtY2xvdWQtZWRnZXJvcy5vc3MtY24taGFuZ3pob3UuYWxpeXVuY3MuY29tL2VkZ2Vyb3MtcHVibGljLXJlc291cmNlLzU3ZTYyYTk3LWY5MGEtNDNjNi1hNWQwLTdhMjY1NzhiMzFhMy5qcGciLCJhdGkiOiIzOGJhZmQxNy01ZjU1LTRiMWUtODIxZi0yOGJmOWRjMjkyMmIiLCJuaWNrbmFtZSI6IjE4NioqKiowMTUzIiwiZXhwIjoxNzEwMzk4ODM3LCJhY29pZCI6IjIzOTk5MiIsImp0aSI6ImUwNzRlZThhLWU0OTItNDIxZi1hYmI5LWRlZGU0OWZmMTI3NCIsImVtYWlsIjoiNDk1MjM1MTE4QHFxLmNvbSIsImNsaWVudF9pZCI6ImFjb2luZm9fdmlwIiwidXNlcm5hbWUiOiJmdXdlbmhhbyJ9.cJ1VmAxcj4p7PMbkEH-UOWjjPTcmkIjkB8v1yVm1A3QgrurqCCZeJvr7ZYPjmSoBSRSQMzI9L_pSbhO6XecMAHVYgC7oGUpu5Gl5_5711rWbUMNLzR7AOgJa2-NHj63OiaESL4Kfw2CXQCe2qIgPbCfHOPEh-YBb6KoOS9ivNHMwbgMSqQNg1bnwmk3DvcfSJ3bAIJ1iSZ8LTlw45i7RVI3-LwdomFMPONnBHRGrOxtO5kOXB9sABVqUcpwSCdLZOfQJ1wk_5EdFq7ObIoEByKW9F3BzTbXbr11FGWScHNSnoOpJaY1y6f63EyjoAo-zPaLverCqb-xg1H_uvUioqA',
  profile: 'https://dev-cloud-edgeros.oss-cn-hangzhou.aliyuncs.com/edgeros-public-resource/57e62a97-f90a-43c6-a5d0-7a26578b31a3.jpg',
  nickname: '186****0153',
  jti: '38bafd17-5f55-4b1e-821f-28bf9dc2922b',
  deviceId: null,
  registered: false,
  expiresIn: 10799,
  developer: {
    status: 0,
    certifyId: null,
    activeAt: '2023-03-30 10:51:02',
    certifiedAt: null,
    signExpire: 31536000,
    certifyExpire: null,
    vendorId: '66a18aa70fc011ecb9d000163e0eccf4',
    deviceVendorName: null,
    deviceVendorId: null,
    deviceVendorStatus: 0
  }
}

/**
 * create login bar
 */
export default function createLoginStatusBar (context: vscode.ExtensionContext) {
  const CommandId = 'edgeros.login'

  // registry cmd
  const disposable = vscode.commands.registerCommand(CommandId, (...options: string[]) => {
    const userInfo = getUserInfo(context)
    if (userInfo === undefined) {
      vscode.window.showInformationMessage('尚未登陆EdgerOS开发者账号', 'Login', 'Developer').then((selection) => {
        if (selection === 'Login') {
          loginInput(context)
        } else if (selection === 'Developer') {
          vscode.env.openExternal(vscode.Uri.parse('https://www.edgeros.com/legal/developer'))
        }
      })
    } else {
      vscode.window.showInformationMessage(`用户信息:${userInfo.nickname}`, 'Logout').then((selection) => {
        if (selection === 'Logout') {
          setUserInfo(context, undefined)
        }
      })
    }
  })

  context.subscriptions.push(disposable)

  // show status bar
  const loginStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999)
  loginStatusBarItem.command = CommandId
  loginStatusBarItem.text = '$(edgeros-log) Login'
  loginStatusBarItem.show()

  context.subscriptions.push(loginStatusBarItem)
}

function loginInput (context: vscode.ExtensionContext) {
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

      const userInfo:UserInfo = res.data.data

      loginInput.hide()
      setUserInfo(context, userInfo)
      vscode.window.showInformationMessage(`EdgerOS 开发者:${userInfo.phone} 登录成功`)
    }
  } catch (err) {
    console.log('未知错误')
    console.error(err)
  }
}

/**
 * 设置用户信息
 */
function setUserInfo (context: vscode.ExtensionContext, userInfo: UserInfo|undefined) {
  context.globalState.update(edgerosGlobalUserInfoKey, userInfo)
}

/**
 * 获取用户信息
 */
export function getUserInfo (context: vscode.ExtensionContext): UserInfo | undefined {
  const userInfo = context.globalState.get<UserInfo>(edgerosGlobalUserInfoKey)
  return userInfo
}
