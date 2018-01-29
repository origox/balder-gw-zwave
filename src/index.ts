import { MqttClient, MqttClientConfig } from './lib/MqttClient';
import { SocketServer } from './lib/SocketServer';
import * as fs from 'fs';
import { inspect } from 'util';
import * as rest from 'restler';
import { config } from 'dotenv';

// Load environment i.e .env file
config();

const mqttConfig: MqttClientConfig = {
    'clientId': process.env.BALDER_CLIENTID,
    gatewaytype: process.env.GATEWAY_TYPE,
    gatewayid: process.env.GATEWAY_ID,
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
const sensorid = [];
const sensorType = [];

gw_config = JSON.parse(fs.readFileSync('./dist/config.json').toString());
console.log(`jf - ${gw_config}`)

for (let i = 0; i < gw_config.length; i++) {
    let device = gw_config[i];
    tcp_incoming.push(device.tcp_incoming);
    console.log(`d: ${device.tcp_incoming} o: ${device.topic_outgoing}`);
    topic_outgoing[device.tcp_incoming] = device.topic_outgoing;

    topic_incoming.push(device.topic_incoming);
    url[device.topic_incoming] = device.url;

    sensorid[device.tcp_incoming] = device.deviceid;
    sensorType[device.tcp_incoming] = device.devicetype;
}

// Create MQTT Client Interface
const mqttClient = new MqttClient(mqttConfig);
mqttClient.start();

// Register sensors
//mqttClient.register(sensorid);

mqttClient.subscribe(topic_incoming);

mqttClient.on('mqtt_request', (topic, message) => {
    let options = { 'username': process.env.RAZBERRY_GUI_USERNAME, 'password': process.env.RAZBERRY_GUI_PASSWORD}

    // Create valid url to perform z-wave command
    const cmdurl = url[topic].replace('<value>', JSON.parse(message).cmd.toString());

    executeHttp(CSSMediaRule, options);
});

// Create TCP/Z-wave Interface
const socketServer = new SocketServer(parseInt(process.env.RAZBERRY_SOCKET_SRV_PORT));
socketServer.start();

socketServer.on('zwavedata', (data) => {
    const d = JSON.parse(data);
    console.log(`ÌNSPECT - ${inspect(d)}`);
    console.log(`recevied zwave data: ${topic_outgoing[d.id]}`);
    //mqttClient.send(topic_outgoing[d.id], JSON.stringify(d));
    mqttClient.publisDeviceEvent(sensorType[d.id], sensorid[d.id], 'status', 'json', d);
});

function executeHttp(url, options) {
    rest.get(url, options).on('complete', (result) => {
        if (result instanceof Error) {
            console.log('Error:', result.message);
        } else {
            console.log(`Command executed succesfully: ${result.code}`);
        }
    });
}