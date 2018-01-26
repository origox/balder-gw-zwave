import * as fs from 'fs';

/*
const mqttConfig: MqttClientConfig = {
    'clientId': 'myclientid',
    'username': 'apa', 
    'password': 'apapass'
} 
*/
const CONFIGPATH = './dist/config.json'

const config = JSON.parse(fs.readFileSync(CONFIGPATH).toString());