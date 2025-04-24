const http = require('http');

const PORT = 4318; // Default OTLP HTTP port

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && ['/v1/traces', '/v1/logs', '/v1/metrics'].includes(req.url)) {
        // let body = '';

        // req.on('data', chunk => {
        //     body += chunk.toString();
        // });

        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({}));
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`OTLP server is running on port ${PORT}`);
});
