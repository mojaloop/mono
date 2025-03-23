#! /bin/bash

export OTEL_LOGS_EXPORTER=none
# export OTEL_TRACES_EXPORTER=none
export OTEL_METRICS_EXPORTER=none
export OTEL_SERVICE_NAME=csl
export OTEL_TRACES_SAMPLER=always_on
export OTEL_RESOURCE_ATTRIBUTES=service.name=csl
export OTEL_PROPAGATORS=tracecontext,baggage

    # --require ./hub/node_modules/@opentelemetry/auto-instrumentations-node/build/src/register \
UV_THREADPOOL_SIZE=30 node \
    hub/index.js "$@"
