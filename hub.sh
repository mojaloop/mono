#! /bin/bash

    # --prof \
UV_THREADPOOL_SIZE=30 node \
    hub/index.js "$@" --otel
