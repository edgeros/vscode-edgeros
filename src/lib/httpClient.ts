/*
 * @Author: FuWenHao  
 * @Date: 2021-01-25 10:08:45 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-21 10:49:08
 */
import axios from "axios";
import * as fs from "fs-extra";
import * as moment from "moment";
import * as path from "path";
var httpClient = axios.create({
  maxContentLength: 268435456,//256MB
  timeout: 300000,
  maxRedirects: 5,
});

httpClient.interceptors.request.use(function (config) {
  return config;
}, function (error) {
  return Promise.reject(error);
});


httpClient.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  error = statusCodeHandle(error);
  return Promise.reject(error);
});

export default httpClient;

/**
 * httpError Handel
 * @param error 
 * @returns 
 */
function statusCodeHandle(error: any) {
  // http request error record
  fs.appendFileSync(
    path.join(__dirname, '../../log/error.txt'),
    `
  ================= time:${moment().format()} =================
  host: ${error.config.baseURL}
  path:${error.config.url}
  message:${error.message}
  response:${error.response ? JSON.stringify({ status: error.response.status, data: error.response.data }) : error.response}
  `,
    'utf8');

  // http resquest error handle
  if (error.response) {
    if (error.response.status === 401) {
      error = new Error('edger_connect_authenticationFailed.text');
    } else if (error.response.status === 403) {
      if (error.response.data.indexOf('Please try again in') !== -1) {
        let execArray = /\d+/g.exec(error.response.data);
        let timeStr = execArray ? String(execArray[0]) : 'null';
        error = new Error('edger_connect_tryAgentConnect.text');
      } else if (error.response.data === 'Password incorrect!') {
        error = new Error('edger_connect_wrongPassword.text');
      } else {
        error = new Error('edger_connect_illegalConnect.text');
      }
    }
  }

  return error;
}