const udp = require('dgram');
const stream = require('readable-stream');
const crypto = require('crypto');
const winston = require('winston');

const context = require('./package.json').name.replace('@mojaloop/', '');

class UdpStream extends stream.Writable {
    constructor(config) {
        config = config || {};
        super({ autoDestroy: true, ...config });
        this.socket = udp.createSocket(config.type || 'udp4');
        this.id = crypto.randomBytes(16);


        this.socket.on('message', msg => {
            try {
                msg = JSON.parse(msg.toString('utf8'));
                switch (msg && msg.method) {
                    case 'uuid': this.id = crypto.randomBytes(16);
                }
            } catch (e) { }
        });
        this.on('error', () => { }); // ignore udp errors
        this.host = config.host;
        this.port = config.port;
        this.max = config.max;
        this.mtu = (config.mtu || 1400) - this.id.length;
    }

    _write(message, encoding, done) {
        if (typeof message === 'object') {
            message = {context, ...message};
            if (typeof message.message === 'string') {

                let [, component, method] = /^(\w+)::(\w+)/.exec(message.message) || [];
                let type;
                switch (component?.toLowerCase()) {
                    case 'consumer': type = 'event'; break;
                }
                if (!component) {
                    const [, match1, match2] = /^(\[==> req\]|\[<== \d+\]) (\w+)/.exec(message.message) || [];
                    if (match1) {
                        type = match1 === '[==> req]' ? 'request' : 'response';
                        component = 'http';
                        method = match2;
                    }
                }
                message = {
                    ...message,
                    component,
                    method,
                    type
                };
            }
            message = Buffer.from(JSON.stringify(message) + '\n', encoding);
        } else if (typeof message === 'string') {
            message = Buffer.from(message, encoding);
        }
        if (this.max && message && message.length > this.max) {
            done();
            return;
        }
        const id = this.id.slice();
        const send = (start, length, cb) => {
            this.socket.send(Buffer.concat([id, message.slice(start, start + length)]), this.port, this.host, cb);
        };
        const sendFrame = (start, length) => {
            if (start + length >= message.length) {
                send(start, message.length - start, done);
            } else {
                send(start, length, err => {
                    if (err) {
                        done(err);
                    } else {
                        setImmediate(() => sendFrame(start + length, length));
                    }
                });
            }
        };
        sendFrame(0, this.mtu);
    }
    _destroy(error, callback) {
        this.socket.close(err => callback && callback(err || error));
    }
}

module.exports = config => new UdpStream(config);

const createLogger = winston.createLogger;
winston.createLogger = function (config) {
    return createLogger({
        ...config,
        transports: [
            ...config.transports,
            new winston.transports.Stream({
                format: winston.format.uncolorize(),
                stream: new UdpStream({
                    objectMode: true,
                    host: 'mono-log.mojaloop-test.svc.cluster.local',
                    port: 41234
                })
            })
        ]
    });
}
