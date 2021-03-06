/**
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@acoinfo.com>
 * File   : edgerosConsole.ts
 * Desc   : EdgerOS console component
 */

import * as vscode from 'vscode'
import { Writable } from 'stream'
import { EdgerosConsole } from '../utility/edgerosConsole'
import { ConsoleStatusButton } from './statusBar'
import { EdgerosDevice, Component } from '../types'
import { edgerosConsolePort } from '../config'

/**
 * Console as component module, which consists of:
 *   1. a status bar item of connection status
 *   2. an output channel of tcp console connection
 */
class ConsoleComponent implements Component {
  private tcpConsole: EdgerosConsole | undefined
  private channel: vscode.OutputChannel | undefined
  private channelStream: Writable | undefined
  private statusButton: ConsoleStatusButton | undefined

  dispose () {
    this.disconnect()
    this.channel?.dispose()
    this.statusButton?.dispose()
    this.channel = undefined
    this.statusButton = undefined
  }

  disconnect () {
    if (this.tcpConsole) {
      this.tcpConsole.unpipe()
      this.tcpConsole.close()
      this.tcpConsole = undefined
    }
    if (this.statusButton) {
      this.statusButton.disconnected()
    }
  }

  connect (device: EdgerosDevice) {
    const statusButton = this.statusButton ||
      (this.statusButton = new ConsoleStatusButton(device))
    const channel = this.channel ||
      (this.channel = vscode.window.createOutputChannel('EdgerOS Console'))
    const tcpConsole = this.tcpConsole ||
      (this.tcpConsole = new EdgerosConsole(new Writable({
        write (chunk, encoding, callback) {
          channel?.append(chunk.toString())
          callback()
        }
      })))

    tcpConsole.connect(device.devIp, edgerosConsolePort)
      .on('connect', () => {
        statusButton.connected(device!)
      })
      .on('reconnect', (alreadyTried, maxRetries) => {
        statusButton.connecting(device!, `${alreadyTried}/${maxRetries}`)
      })
      .on('close', () => {
        this.disconnect()
      })
      .on('error', err => {
        vscode.window.showWarningMessage('EdgerOS console error: ' + err.message)
        this.disconnect()
      })
      .on('fail', () => {
        this.disconnect()
      })

    channel.show()
    statusButton.connecting(device!)
  }
}

const singleton = new ConsoleComponent()

let lastKnownDevice: EdgerosDevice | undefined

export function connect (device?: EdgerosDevice) {
  if (device) {
    lastKnownDevice = device
    return singleton.connect(device)
  } else if (lastKnownDevice) {
    device = lastKnownDevice
    return singleton.connect(device)
  } else {
    console.warn('console open failed: no last known device!')
  }
}

export function disconnect () {
  return singleton.disconnect()
}

export function dispose () {
  return singleton.dispose()
}
