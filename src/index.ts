import { MqttClient, MqttClientConfig } from './lib/MqttClient';
import { SocketServer } from './lib/SocketServer';
import * as fs from 'fs';
import { inspect } from 'util';
import * as rest from 'restler';
import { config } from 'dotenv';

// Load environment i.e .env file
config();

const mqttConfig: MqttClientConfig = {
    'clientId': 'MyclientID',
    broker_address: process.env.MQTTS_BROKER_ADDRESS,
    rejectUnauthorized: false,
    ca: [fs.readFileSync('./dist/ca.crt')]
};

// Load config
let gw_config = [];
const tcp_incoming = [];
const topic_outgoing = [];
const topic_incoming = [];
const url = [];

gw_config = JSON.parse(fs.readFileSync('./dist/config.json').toString());
console.log(`jf - ${gw_config}`)

for (let i = 0; i < gw_config.length; i++) {
    let device = gw_config[i];
    tcp_incoming.push(device.tcp_incoming);
    console.log(`d: ${device.tcp_incoming} o: ${device.topic_outgoing}`);
    topic_outgoing[device.tcp_incoming] = device.topic_outgoing;

    topic_incoming.push(device.topic_incoming);
    url[device.topic_incoming] = device.url;
}

// Create MQTT Client Interface
const mqttClient = new MqttClient(mqttConfig);
mqttClient.start();

mqttClient.subscribe(topic_incoming);

mqttClient.on('mqtt_request', (topic, message) => {
    //console.log(`MQTT_REQUEST topic: ${topic} message: ${message}`)
    //console.log(`SEND HTTP REQ: ${url[topic]}`)
    let options = { 'username': 'admin', 'password': 'kloker' }

    //let a = url[topic].replace('<value>', (JSON.parse(message).cmd).toString())
    //console.log(`a = ${JSON.stringify(message)}\n\n`)
    //console.log(`b =${JSON.parse(message).cmd.toString()}\n\n`)

    // Create valid url to perform z-wave command
    let a = url[topic].replace('<value>', JSON.parse(message).cmd.toString())

    executeHttp(a, options)
});

// Create TCP/Z-wave Interface 
const socketServer = new SocketServer(parseInt(process.env.RAZBERRY_SOCKET_SRV_PORT));
socketServer.start();

socketServer.on('zwavedata', (data) => {
    let d = JSON.parse(data);
    //console.log(`ÌNSPECT - ${inspect(d)}`)
    console.log(`recevied zwave data: ${topic_outgoing[d.id]}`);
    mqttClient.send(topic_outgoing[d.id], JSON.stringify(d));
});

function executeHttp(url, options) {
    rest.get(url, options).on('complete', function (result) {
        if (result instanceof Error) {
            console.log('Error:', result.message);
        } else {
            console.log("Command executed succesfully: " + result.code);
        }
    });
}



