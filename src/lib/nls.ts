import * as fs from "fs-extra";
import * as path from "path";



/**
 * 当前选择语言
 */
export const languge = (JSON.parse(process.env.VSCODE_NLS_CONFIG ? process.env.VSCODE_NLS_CONFIG : "{\"locale\":\"en\"}")).locale;

/**
 * nls翻译解析
 * @param filePath :文件路径
 */
export default function nlsConfig(filePath: string) {
  let filePathArray = filePath.split(path.sep);
  let fileName = filePathArray.pop(); // fileName
  let dirPath = filePathArray.join(path.sep);//root path
  let i18nFilePath = [];
  while (true) {
    console.log(dirPath);
    let dirs = fs.readdirSync(dirPath);
    if (dirs.indexOf('package.json') != -1) {
      break
    }
    let dirArray = dirPath.split(path.sep);
    i18nFilePath.unshift(dirArray.pop());
    dirPath = dirArray.join(path.sep)
  }
  let jsonMapPath = path.join(dirPath, 'i18n', languge, i18nFilePath.join(path.sep), fileName?.split('.')[0] + '.i18n.json')
  let jsonData: any = {};
  if (fs.existsSync(jsonMapPath)) {
    jsonData = require(jsonMapPath);
  }

  return function localize(key: string, value: string) {
    return jsonData[key] || value
  }
}
