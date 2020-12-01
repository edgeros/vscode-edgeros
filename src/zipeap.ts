import { EdgerProgress } from "./progress";
var onezip = require('./utils/onezip.js');


export type ProgressState = 'progress' | 'error' | 'end' | 'start';
const zipTitle: string = '压缩中'

interface doZipOption {
  from?: string;
  to?: string;
  files?: Array<string>;
}

export function ZipAsync(from: string, to: string,files:string[], progress: EdgerProgress): Promise<boolean> {
  return new Promise((resole) => {
   
    DoZip({ from, to, files }, (state: ProgressState, pNum: string) => {
      
      if (state === 'end') {
        progress.hide();
        resole(true)
        return;
      }
      if (state === 'error') {
        progress.hide();
        resole(false)
      }
      if (state === 'start') {
        progress.show({ num: 0, msg: zipTitle });
        return;

      }
      const num = parseInt(pNum, 10);
      progress.show({ num, msg: zipTitle });
    });
  })
}

export function DoZip(opt: doZipOption, progressFn: (state: ProgressState, progress: string) => void) {

  if (!opt) opt = {};

  let { from = '', to = '', files = [] } = opt;
  if (!from || !to) {
    return;
  }
  console.warn('DoZip, doZipOption: ', JSON.stringify(opt));
  const pack = onezip.pack(from, to, files);

  pack.on('progress', (percent: string) => {
    progressFn('progress', percent)
  });
  pack.on('error', (error: Error) => {
    console.error(error);
    progressFn('error', '0')
  });
  pack.on('start', (percent: string) => {
    progressFn('start', '0')
  });

  pack.on('end', () => {
    progressFn('end', '100')
  });

}