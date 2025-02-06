#! /bin/bash

UV_THREADPOOL_SIZE=30 node --watch hub/index.js "$1" "$2"
