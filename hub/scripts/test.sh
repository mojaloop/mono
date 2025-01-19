#!/bin/bash

set -xe

docker compose up -d --wait
docker compose ps
npm run migrate
touch .env
UV_THREADPOOL_SIZE=30 node index.js test provision
UV_THREADPOOL_SIZE=30 node index.js test gp

docker compose down
