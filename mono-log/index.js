import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import dgram from 'node:dgram';
import { WebSocketServer, WebSocket } from 'ws';
import { LRUCache } from 'lru-cache';
import split2 from 'split2';
import { monotonicFactory } from 'ulidx';

const ulid = monotonicFactory();
const FILTER = Symbol('filter');

const init = async ({
    port = 5170,
    streamId = false
} = {}) => {
    const server = Hapi.server({
        port: 8080,
        host: '0.0.0.0'
    });

    await server.register(inert);

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: `${import.meta.dirname}/build`,
                index: ['index.html']
            }
        }
    });

    await server.start();
    console.log('Hapi server running on %s', server.info.uri);

    const cache = new LRUCache({
        max: 100,
        maxAge: 60 * 1000
    });

    const wss = new WebSocketServer({ server: server.listener });

    function heartbeat() {
        this.isAlive = true;
    }

    wss.on('connection', function connection(ws) {
        ws.isAlive = true;
        ws.on('error', console.error);
        ws.on('pong', heartbeat);
        ws.on('close', function wsClose(code, reason) {
            console.log(`WebSocket closed: ${ws?._socket?.remoteAddress}:${ws?._socket?.remotePort}, code:${code}, reason: ${reason}`);
        });
        console.log(`WebSocket connected: ${ws?._socket?.remoteAddress}:${ws?._socket?.remotePort}`);
    });

    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', function close() {
        clearInterval(interval);
    });

    const logMessages = [];

    const match = filter => log => {
        if (!filter || !Object.keys(filter).length) return true;
        for (const key in filter) {
            switch (key) {
                case 'ulidStart':
                    if (log.ulid <= filter[key]) return false;
                    break;
                case 'ulidEnd':
                    if (log.ulid >= filter[key]) return false;
                    break;
                default:
                    if (typeof filter[key] === 'array') {
                        if (!filter[key].includes(log[key])) return false;
                    } else
                        if (log[key] !== filter[key]) return false;
                    break;
            }
        }
        return true;
    }

    const filterBy = filter => (!filter || !Object.keys(filter).length) ? logMessages : logMessages.filter(match(filter))

    wss.on('message', function message(msg) {
        try {
            const { method, ...rest } = JSON.parse(msg);
            switch (method) {
                case 'get':
                    ws.send(JSON.stringify(filterBy(rest)));
                    ws[FILTER] = rest;
                    break;
                case 'filter':
                    ws[FILTER] = rest;
                    break;
                default:
                    console.warn(`Unknown method: ${method}`);
                    break;
            }
        } catch (error) {
            console.error(error, msg);
        }
    });

    const udpServer = dgram.createSocket('udp4');

    const createStream = (id, rinfo) => {
        const result = split2(/\n/, JSON.parse, { maxLength: 16 * 1024 });
        cache.set(id, result);
        result.on('data', msg => {
            if (!msg.ulid) msg.ulid = ulid();
            logMessages.push(msg);
            if (logMessages.length > 1000) logMessages.shift();

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    if (match(client[FILTER])(msg)) client.send(JSON.stringify(msg));
                }
            });
        });
        result.mapper = msg => {
            try {
                return JSON.parse(msg);
            } catch (error) {
                console.error(error, msg);
                result.destroy();
                return null;
            }
        };
        result.on('error', error => {
            console.error(error, result._last);
            result.destroy();
        });
        result.on('close', () => {
            cache.delete(id);
            udpServer.send(JSON.stringify({ method: 'restart' }), rinfo.port, rinfo.address); // notify sender to generate new stream id
        });
        return result;
    };

    udpServer.on('message', (msg, rinfo) => {
        const id = streamId ? msg.subarray(0, 16).toString('hex') : rinfo.address + ':' + rinfo.port;
        const stream = cache.get(id) || createStream(id, rinfo);
        stream.write(streamId ? msg.subarray(16) : msg);
    });

    udpServer.on('close', () => {
        cache.clear();
    });

    udpServer.on('listening', () => {
        const address = udpServer.address();
        console.log(`UDP server listening on ${address.address}:${address.port}`);
    });

    udpServer.bind({
        port,
        exclusive: true
    });

};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
