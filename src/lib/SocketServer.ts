import { createServer, Server } from 'net';
import { EventEmitter } from 'events';

export class SocketServer extends EventEmitter {

    private server: Server;

    constructor(private port: number) {
        super();
        console.log(`myport: ${port}`);
    }

    public start() {

        createServer((socket) => {

            console.log(`New client : ${socket.remoteAddress}:${socket.remotePort}`);

            socket.on('error', (err) => {
                console.log('Error occured:' + err);
            });

            socket.on('data', (data) => {
                console.log('Received: ' + data);
                this.emit('zwavedata', data);
                //this.client.destroy()
            });

            socket.on('close', () => {
                console.log('Connection closed');
            });

        }).listen(this.port);
    }
}