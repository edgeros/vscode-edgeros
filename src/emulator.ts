import {TcpClient}  from './tcpClient';
const {spawn, exec} = require('child_process');

export class Emulator {
    
    //tcp 客户端
    tcp: TcpClient;
    //1: 模拟器开启状态, 2: 模拟器关闭状态
    status = 2;

    constructor() {
        let subProcess = spawn('', [], {detached: true, stdio: 'inherit'} );
        subProcess.unref();
        this.tcp = new TcpClient('10.4.0.12', 8080);
        this.tcp.event.on('status', (data) => {
            switch(data) {
                case 1: console.log('模拟器已打开'); this.status = data; break;
                case 2: console.log('模拟器已关闭'); this.status = data; break;
                case 3: console.log('操作模拟器器错误'); break;
                default: console.log('未知错误');
            }
        });
    }

    openEmulator() {
        this.tcp.send(1);
    }

    closeEmulator() {
        this.tcp.send(2);
    }
}