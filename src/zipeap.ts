 
import { init, localize }   from "./utils/locale";
import { EdgerProgress } from "./progress";
import * as  onezip from './utils/onezip';

export type ProgressState = 'progress' | 'error' | 'end' | 'start';


interface doZipOption {
  from?: string;
  to?: string;
  files?: Array<string>;
}

export function zipAsync(from: string, to: string,files:string[], progress: EdgerProgress): Promise<boolean> {
  const zipTitle: string = localize('archive_doing.text', "Archiving");
  return new Promise((resole) => {
   
    doZip({ from, to, files }, (state: ProgressState, pNum: string) => {
      
      if (state === 'end') {
        progress.hide();
        resole(true);
        return;
      }
      if (state === 'error') {
        progress.hide();
        resole(false);
      }
      if (state === 'start') {
        progress.show({ num: 0, msg: zipTitle });
        return;

      }
      const num = parseInt(pNum, 10);
      progress.show({ num, msg: zipTitle });
    });
  });
}

export function doZip(opt: doZipOption, progressFn: (state: ProgressState, progress: string) => void) {

  if (!opt) {opt = {};}

  let { from = '', to = '', files = [] } = opt;
  if (!from || !to) {
    return;
  }
  const pack = onezip.pack(from, to, files);

  pack.on('progress', (percent: string) => {
    progressFn('progress', percent);
  });
  pack.on('error', (error: Error) => {
    console.error(error);
    progressFn('error', '0');
  });
  pack.on('start', (percent: string) => {
    progressFn('start', '0');
  });

  pack.on('end', () => {
    progressFn('end', '100');
  });

}