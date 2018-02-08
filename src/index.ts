import { MqttClient, MqttClientConfig } from './lib/MqttClient';
import { SocketServer } from './lib/SocketServer';
import { RpiMonitor } from './lib/RpiMonitor';
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
let gwConfig = [];
const tcpIncoming = [];
const topicOutgoing = [];
const topicIncoming = [];
const url = [];
const sensorid = [];
const sensorType = [];

gwConfig = JSON.parse(fs.readFileSync('./dist/config.json').toString());
console.log(`jf - ${gwConfig}`);

for (let i = 0; i < gwConfig.length; i++) {
    const device = gwConfig[i];
    tcpIncoming.push(device.tcp_incoming);
    console.log(`d: ${device.tcp_incoming} o: ${device.topic_outgoing}`);
    topicOutgoing[device.tcp_incoming] = device.topic_outgoing;

    topicIncoming.push(device.topic_incoming);
    url[device.topic_incoming] = device.url;

    sensorid[device.tcp_incoming] = device.deviceid;
    sensorType[device.tcp_incoming] = device.devicetype;
}

// Create MQTT Client Interface
const mqttClient = new MqttClient(mqttConfig);
mqttClient.start();

// Register sensors  
//mqttClient.register(sensorid);

mqttClient.subscribe(topicIncoming);

mqttClient.on('mqtt_request', (topic, message) => {
    const options = { 'username': process.env.RAZBERRY_GUI_USERNAME, 'password': process.env.RAZBERRY_GUI_PASSWORD };

    // Create valid url to perform z-wave command
    //const cmdurl = url[topic].replace('<value>', JSON.parse(message).cmd.toString());
    const cmdurl = url[topic].replace('<value>', message);

    //executeHttp(CSSMediaRule, options);
    executeHttp(cmdurl, options);
});

// Create TCP/Z-wave Interface
const socketServer = new SocketServer(parseInt(process.env.RAZBERRY_SOCKET_SRV_PORT));
socketServer.start();

socketServer.on('zwavedata', (data) => {
    const d = JSON.parse(data);
    const payload = JSON.stringify({ level: d.level, scale: d.scale, ts: d.time });
    console.log(`ÌNSPECT(payload): ${payload}`);
    //console.log(`recevied zwave data: ${topicOutgoing[d.id]}`);
    //mqttClient.send(topicOutgoing[d.id], JSON.stringify(d));
    mqttClient.publisDeviceEvent(sensorType[d.id], sensorid[d.id], 'status', 'json', payload);
});

function executeHttp(url: any, options: any) {
    rest.get(url, options).on('complete', (result) => {
        if (result instanceof Error) {
            console.log('Error:', result.message);
        } else {
            console.log(`Command executed succesfully: ${result.code}`);
        }
    });
}

// Check RPI
const rpiMonitor = new RpiMonitor();
rpiMonitor.getCPUTemperature();
rpiMonitor.on('temperatureUpdate', (time, temp) => {
    console.log(`temperature update - ${temp}`);
    mqttClient.publishGatewayEvent('status', 'json',
        JSON.stringify({ level: temp, scale: '*C', ts: time}));
});
