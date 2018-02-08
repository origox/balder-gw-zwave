import { EventEmitter } from 'events';
import { exec } from 'child_process';

export class RpiMonitor extends EventEmitter {

    constructor() {
        super();
    }

    public getCPUTemperature() {
        setInterval(() => {
            const child = exec('cat /sys/class/thermal/thermal_zone0/temp', (error, stdout, stderr) => {
                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    const date = Date.now();
                    const temp = parseFloat(stdout) / 1000;
                    this.emit('temperatureUpdate', date, temp);
                }
            });
        }, 600000);
    }

}