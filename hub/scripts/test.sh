#!/bin/bash

set -xe

docker compose up -d --wait
docker compose ps
npm run migrate
UV_THREADPOOL_SIZE=30 node hub/index.js test provision
UV_THREADPOOL_SIZE=30 node hub/index.js test gp
