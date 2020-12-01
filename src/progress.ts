import { Progress, ProgressLocation, ProgressOptions } from "vscode";

import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export class EdgerProgress {

  private cumulative: number;
  private event: EventEmitter;
  constructor(_event: EventEmitter) {
    this.event = _event;
    this.cumulative = 0;
  }

  hide() {
    this.cumulative = 0;
    this.event.emit('hideProgress');
  }

  show(progress: { num: number, msg: string; }) {

    let { num, msg = '' } = progress;
    if (num !== 0) {
      const increment = (num - this.cumulative) || 0;
      this.cumulative = increment + this.cumulative;
      msg = `${msg} (${this.cumulative}%)`
      this.event.emit('progress', msg, increment);
      return;
    }

    const options: ProgressOptions = {
      location: ProgressLocation.Notification
    }

    vscode.window.withProgress(options, (progress: Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {

      return new Promise((reslove, reject) => {
        progress.report({ increment: num, message: msg });

        this.event.on('progress', (msg: string, num: number) => {
          progress.report({ increment: num, message: msg })
        })

        this.event.on('hideProgress', () => {
          progress.report({ increment: 0 })
          this.event.removeAllListeners('progress');
          this.event.removeAllListeners('hideProgress');
          reslove();
        })

      });

    });
  }
}
