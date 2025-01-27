#! /bin/bash

# UV_THREADPOOL_SIZE=30 node --watch hub/index.js test provision
UV_THREADPOOL_SIZE=30 node --watch hub/index.js test gp
# UV_THREADPOOL_SIZE=30 node --watch hub/index.js test settlement
