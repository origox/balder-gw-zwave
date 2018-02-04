import { connect, Client } from 'mqtt';
import { EventEmitter } from 'events';

export interface MqttClientConfig {
    'clientId': string;
    broker_address: string;
    gatewaytype: string;
    gatewayid: string;
    //'password': string;
    rejectUnauthorized: boolean;
    ca: any[];
}

export class MqttClient extends EventEmitter {

    private client: Client;

    constructor(private config: MqttClientConfig) {
        super();
        //this.config.clientId = config.clientId;
        //this.config.broker_address = config.broker_address;
        //this.config.password = config.password;
    }

    public start(): void {
        console.log(`MQTT START - broker: ${this.config.broker_address}`);
        this.client = connect(this.config.broker_address, {
            clientId: this.config.clientId,
            //username: this.config.username,
            //password: this.config.password
            port: 8883,
            rejectUnauthorized: this.config.rejectUnauthorized,
            ca: this.config.ca
        });

        this.client.on('connect', () => {
            console.log(`\n\nclient.on.connect \n\n`);
            // this.client.publish('presence/hello', 'Hellloo mqtt from thing-gw-zwave-mqtt client')
        });

        this.client.on('close', () => {
            console.log(`\n\nclient.on.close\n\n`);
            // this.client.publish('presence/hello', 'Hellloo mqtt from thing-gw-zwave-mqtt client')
        });

        this.client.on('message', (topic, message) => {
            // message is Buffer
            console.log(message.toString());
            this.emit('mqtt_request', topic, message.toString());
            //this.client.end()
        });
    }

    public subscribe(topics: string[]) {
        const len = topics.length;
        for (let i = 0; i < len; i++) {
            console.log('subscribe');
            this.client.subscribe(topics[i]);
        }
    }

    public send(topic: string, data: string): void {
        console.log(`\n\n jf - sending(${this.config.clientId}) topic:${topic} data: ${data}\n\n`)
        this.client.publish(topic, data, (err) => {
            console.log(`Zwave -> mqtt publish - ${topic} - err: ${err}`);
        });
    }

    public publishGatewayEvent(eventType: string, eventFormat: string, payload: string) {
        this.publishEvent(this.config.gatewaytype, this.config.gatewayid, eventType, eventFormat, payload);
    }

    public publisDeviceEvent(deviceType: string, deviceId: string, eventType: string, eventFormat: string, payload: string) {
        this.publishEvent(deviceType, deviceId, eventType, eventFormat, payload);
    }

    private publishEvent(btype: string, id: string, eventType: string, eventFormat: string, payload: string ) {
        const topic = `ba-1/type/${btype}/id/${id}/evt/${eventType}/fmt/${eventFormat}`;
        //const pay = JSON.stringify(payload);
        console.log(`publishEvent - topic: ${topic}, payload: ${payload}`);
        this.send(topic, payload);

    }

}