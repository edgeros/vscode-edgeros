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
import { Readable, Writable } from 'stream'
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
  private hbTimer: NodeJS.Timeout | undefined
  private writable: Writable

  constructor (writable: Writable, options?: EdgerosConsoleOptions) {
    super()
    this.writable = writable
    this.options = {
      timeout: 5 * 1000,
      retryInterval: 3 * 1000,
      retries: 5,
      ...options
    }
  }

  get isClosed () {
    return !!this.hbTimer
  }

  connect (host: string, port: number, opts?: net.TcpSocketConnectOpts) {
    this.close()

    const { retries, retryInterval: keepalive, timeout } = this.options
    const tcpOptions = Object.assign({}, opts, { host, port })
    const socket = this.socket = net.createConnection(tcpOptions)
    const writable = this.writable

    const reconnect = () => {
      if (++this.socketRetries > retries!) {
        return this.emit('fail', this.socketRetries, retries!)
      }
      this.emit('reconnect', this.socketRetries, retries!)
      this.connect(host, port, opts)
    }

    const connTimeout = setTimeout(() => {
      socket.destroy(Error('socket connect timeout'))
    }, timeout!)

    socket.on('connect', () => {
      clearTimeout(connTimeout)
      console.log(`socket connect ${host}:${port}`, new Date())
      this.startHeartbeat()
      this.socketRetries = 0
      this.emit('connect')
    })
    socket.on('close', hadError => {
      console.log(`socket close ${host}:${port}`, new Date())
      this.stopHeartbeat()
      this.emit('close')

      if (hadError) {
        setTimeout(reconnect, keepalive!)
      }
    })
    socket.on('data', chunk => {
      writable.write(stripAnsi(chunk.toString()))
    })
    socket.on('error', err => {
      console.log(`socket error ${host}:${port}`, err.message)
      socket.destroy(err)
      this.emit('error', err)
    })

    socket.setKeepAlive(true)
    socket.setNoDelay()

    return this
  }

  close () {
    this.stopHeartbeat()

    if (this.socket) {
      this.socket.destroy()
      this.socket.unref()
      this.socket = undefined
    }
  }

  startHeartbeat () {
    if (this.socket) {
      const heartbeatInterval = 1000
      const socket = this.socket
      const hbTimer = this.hbTimer = setInterval(() => {
        if (socket.destroyed) {
          clearInterval(hbTimer)
          this.hbTimer = undefined
        } else {
          socket.write('this will be ignored by EdgerOS')
        }
      }, heartbeatInterval)
    }
  }

  stopHeartbeat () {
    if (this.hbTimer) {
      clearInterval(this.hbTimer)
      this.hbTimer = undefined
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
