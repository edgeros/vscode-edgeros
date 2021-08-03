/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : output.ts
 * Desc   : exntesion output channel component
 */

import * as vscode from 'vscode'

class OutputComponent {
  private channel: vscode.OutputChannel | undefined

  dispose () {
    this.channel?.dispose()
    this.channel = undefined
  }

  show () {
    this.channel?.show()
  }

  append (message: string) {
    createChannel.call(this).append(message)
  }

  appendLine (message: string) {
    createChannel.call(this).appendLine(message)
  }
}

const singleton = new OutputComponent()

export function appendLine (message: string) {
  return singleton.appendLine(message)
}

export function dispose () {
  return singleton.dispose()
}

function createChannel (this: any): vscode.OutputChannel {
  let channel = this.channel
  if (!channel) {
    channel = this.channel = vscode.window.createOutputChannel('EdgerOS')
    channel.show()
  }
  return channel
}
