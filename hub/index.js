const als = require('account-lookup-service/src/server')
const alsConfig = require('account-lookup-service/src/lib/config')
const qs = require('quoting-service/src/server')
const qsHandlersStart = require('quoting-service/src/lib/startingProcess')
const qsHandlersInit = require('quoting-service/src/handlers/init')

const cl = require('@mojaloop/central-ledger/src/shared/setup')
const clConfig = require('@mojaloop/central-ledger/src/lib/config')
const clRoutes = require('@mojaloop/central-ledger/src/api/routes')
const ma = require('@mojaloop/ml-api-adapter/src/shared/setup')
const maConfig = require('@mojaloop/ml-api-adapter/src/lib/config')
const maRoutes = require('@mojaloop/ml-api-adapter/src/api/routes')

async function main() {
    await qs()
    qsHandlersStart(
        () => qsHandlersInit.startFn([
            'QUOTE',
            'BULK_QUOTE',
            'FX_QUOTE'
        ]),
        qsHandlersInit.stopFn
    )
    await cl.initialize({
        service: 'api',
        port: clConfig.PORT,
        modules: [clRoutes],
        handlers: [
            { type: 'prepare', enabled: true },
            { type: 'fulfil', enabled: true },
            { type: 'timeout', enabled: true },
            { type: 'admin', enabled: true },
            { type: 'positionbatch', enabled: true },
            { type: 'get', enabled: true }],
        runMigrations: false,
        runHandlers: true
    })
    await ma.initialize({
        service: 'api',
        port: maConfig.PORT,
        modules: [maRoutes],
        handlers: [{ type: 'notification', enabled: true }],
        runHandlers: true
    })
    await als.initializeApi(alsConfig)
}

main().catch(console.error)
