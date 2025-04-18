import dgram from 'node:dgram';
import { type } from 'node:os';

const udpPort = 5170;
const udpHost = 'localhost';

const client = dgram.createSocket('udp4');

const sendLogMessage = () => {
    const message = Buffer.from(JSON.stringify({
        ms: Date.now(),
        level: ['info', 'error', 'warn', 'debug'][Math.floor(Math.random() * 4)],
        context: 'quote',
        component: 'db',
        method: 'quote.get',
        type: 'request',
        message: 'Hello, world!',
    }));
    client.send(message + '\n', udpPort, udpHost, (err) => {
        if (err) {
            console.error('Error sending message:', err);
        } else {
            console.log('Log message sent:', message.toString());
        }
    });
};

// Send a log message every 5 seconds
setInterval(sendLogMessage, 5000);