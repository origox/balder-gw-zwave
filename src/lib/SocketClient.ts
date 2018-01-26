import { Socket } from 'net';

export class SocketClient {

    public client: Socket;
    constructor(private port: number) {
        this.client = new Socket();
    }

    public start() {

        this.client.connect(this.port, 'localhost', () => {
            console.log('client connected to z-wave server');
            this.client.write('Hello, server! Love, Client.');

        });

        // this.client.connect(this.port);

        this.client.on('error', (err) => {
            console.log('Error occured:' + err);
        });

        this.client.on('data', (data) => {
            console.log('Received: ' + data);
            //this.client.destroy()
        });

        this.client.on('close', () => {
            console.log('Connection closed');
        });
    }
}