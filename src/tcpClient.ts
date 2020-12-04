import * as net from 'net';
import { EventEmitter }  from 'events';

export class TcpClient{
    socket: net.Socket;
    event: EventEmitter;

    constructor(host: string, port: number) {
        this.event = new EventEmitter();
        this.socket = net.createConnection({
            host: host,
            port: port
        });
        this.socket.on('connect', ()=> {

        });
        this.socket.on('data', (data) => {
            this.event.emit('status', data);
        });
    }

    send(msg: any) {
        this.socket.write(msg, (err) => {
            console.log(err);
        });
    }
}