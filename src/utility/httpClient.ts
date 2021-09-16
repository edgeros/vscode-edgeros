/*
 * @Author: FuWenHao
 * @Date: 2021-01-25 10:08:45
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-21 10:49:08
 */
import axios from 'axios'
import * as moment from 'moment'
import { appendLine as outputAppend } from '../components/output'

const httpClient = axios.create({
  maxContentLength: 268435456, // 256MB
  maxBodyLength: 268435456,
  timeout: 300000,
  maxRedirects: 5
})

httpClient.interceptors.request.use(function (config) {
  return config
}, function (error) {
  return Promise.reject(error)
})

httpClient.interceptors.response.use(function (response) {
  return response
}, function (error) {
  error = statusCodeHandle(error)
  return Promise.reject(error)
})

export default httpClient

/**
 * httpError Handel
 * @param error
 * @returns
 */
function statusCodeHandle (error: any) {
  // http request error record
  outputAppend(`
  ================= time:${moment().format()} =================
  host: ${error.config.baseURL}
  path:${error.config.url}
  message:${error.message}
  response:${error.response ? JSON.stringify({ status: error.response.status, data: error.response.data }) : error.response}
  `)

  // http resquest error handle
  if (error.response) {
    if (error.response.status === 401) {
      error = new Error('edger connect authenticationFailed')
    } else if (error.response.status === 403) {
      if (error.response.data.indexOf('Please try again in') !== -1) {
        error = new Error('edger connect tryAgentConnect')
      } else if (error.response.data === 'Password incorrect!') {
        error = new Error('edger connect wrongPassword')
      } else {
        error = new Error('edger connect illegalConnect')
      }
    }
  }

  return error
}
