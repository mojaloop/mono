#!/bin/bash

set -xe

docker compose up -d --wait
docker compose ps
echo "====================="
echo "Running migrations"
echo "====================="
npm run migrate

touch .env
echo "====================="
echo "Running GP provision"
echo "====================="
UV_THREADPOOL_SIZE=30 node index.js test provision || true

echo "====================="
echo "Running P2P"
echo "====================="
UV_THREADPOOL_SIZE=30 node index.js test p2p || true

docker compose stop
