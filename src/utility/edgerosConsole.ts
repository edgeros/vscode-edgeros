/**
* Copyright (c) 2021 EdgerOS Team.
* All rights reserved.
*
* Detailed license information can be found in the LICENSE file.
*
* Author : Fu Tongtang <futongtang@acoinfo.com>
* File   : tcpConsole.ts
* Desc   : EdgerOS tcp console client
*/

import * as net from 'net'
import { Readable } from 'stream'
import { EdgerosConsoleOptions } from '../types'

/**
* Events:
*  - connect: emit on tcp socket connect
*  - close: emit on tcp socket close
*  - error: emit (bypass) the tcp socket error
*  - fail: emit when the maximum `reconnect` has been reached
*/
export class EdgerosConsole extends Readable {
  private options: EdgerosConsoleOptions
  private socketRetries = 0
  private socket: net.Socket | undefined
  private kplTimer: NodeJS.Timeout | undefined

  constructor (options?: EdgerosConsoleOptions) {
    super()
    this.options = {
      keepalive: 5000,
      retries: 3,
      ...options
    }
  }

  get isClosed () {
    return !!this.kplTimer
  }

  connect (host: string, port: number, opts?: net.TcpSocketConnectOpts) {
    const tcpOptions = Object.assign({}, opts, { host, port })
    const { keepalive, retries } = this.options
    const socket = this.socket = net.createConnection(tcpOptions)

    const startKeepAlive = () => {
      this.kplTimer = setInterval(function () {
        socket.write('this will be ignored by EdgerOS')
      }, keepalive!)
    }
    const stopKeepAlive = () => {
      if (this.kplTimer) {
        clearInterval(this.kplTimer!)
        this.kplTimer = undefined
      }
    }
    const reconnect = () => {
      if (++this.socketRetries > retries!) {
        this.emit('fail', this.socketRetries, retries!)
      } else {
        this.emit('reconnect', this.socketRetries, retries!)
        this.connect(host, port, opts)
      }
    }

    const timeout = setTimeout(reconnect, keepalive!)

    socket.on('connect', () => {
      clearTimeout(timeout)
      startKeepAlive()
      this.socketRetries = 0
      this.emit('connect')
    })
    socket.on('close', hadError => {
      clearTimeout(timeout)
      stopKeepAlive()
      socket.destroy()
      this.emit('close')

      if (hadError) {
        reconnect()
      }
    })
    socket.on('data', chunk => {
      this.emit('data', stripAnsi(chunk.toString()))
    })
    socket.on('error', err => {
      this.emit('error', err) // just forward to client
    })

    socket.setKeepAlive(true)
    socket.setNoDelay()

    return this
  }

  close () {
    if (this.kplTimer) {
      clearInterval(this.kplTimer!)
      this.kplTimer = undefined
    }
    if (this.socket) {
      this.socket.destroy()
      this.socket = undefined
    }
  }
}

const regex = ansiRegex()

function stripAnsi (string: string) {
  return string.replace(regex, '')
}

function ansiRegex ({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|')
  return new RegExp(pattern, 'gim')
}
