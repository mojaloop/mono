const { resolve } = require('path')

async function discovery() {
    const als = require('account-lookup-service/src/server')
    const alsConfig = require('account-lookup-service/src/lib/config')
    await als.initializeApi(alsConfig)
    await als.initializeAdmin(alsConfig)
}

async function agreement() {
    const qs = require('quoting-service/src/server')
    const qsHandlersStart = require('quoting-service/src/lib/startingProcess')
    const qsHandlersInit = require('quoting-service/src/handlers/init')
    await qs()
    qsHandlersStart(
        () => qsHandlersInit.startFn([
            'QUOTE',
            'BULK_QUOTE',
            'FX_QUOTE'
        ]),
        qsHandlersInit.stopFn
    )
}

async function adapter() {
    const ma = require('@mojaloop/ml-api-adapter/src/shared/setup')
    const maConfig = require('@mojaloop/ml-api-adapter/src/lib/config')
    const MetricsPlugin = require('@mojaloop/central-services-metrics').plugin

    await ma.initialize({
        service: 'api',
        port: maConfig.PORT,
        modules: [!maConfig.INSTRUMENTATION_METRICS_DISABLED && MetricsPlugin].filter(Boolean),
        handlers: [{ type: 'notification', enabled: true }],
        runHandlers: true
    })
}

async function ledger() {
    const cl = require('@mojaloop/central-ledger/src/shared/setup')
    const clConfig = require('@mojaloop/central-ledger/src/lib/config')
    const clRoutes = require('@mojaloop/central-ledger/src/api/routes')
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
}

async function ttk() {
    const RequestLogger = require('ml-testing-toolkit/src/lib/requestLogger')
    const apiServer = require('ml-testing-toolkit/src/lib/api-server')
    const socketServer = require('ml-testing-toolkit/src/lib/socket-server')
    const Config = require('ml-testing-toolkit/src/lib/config')
    const server = require('ml-testing-toolkit/src/server')
    const mbConnectionManager = require('ml-testing-toolkit/src/lib/configuration-providers/mb-connection-manager')
    const reportGenerator = require('ml-testing-toolkit/src/lib/report-generator/generator')

    RequestLogger.logMessage('info', 'Toolkit Initialization started...', { notification: false })
    await Config.loadSystemConfig()
    await Config.loadUserConfig()
    apiServer.startServer(5050)
    socketServer.initServer(apiServer.getHttp())
    const systemConfig = Config.getSystemConfig()
    if (systemConfig.CONNECTION_MANAGER.ENABLED) {
        await mbConnectionManager.initialize()
    }
    await reportGenerator.initialize()
    await server.initialize()
    RequestLogger.logMessage('info', 'Toolkit Initialization completed.', { notification: false, additionalData: 'TTK API at http://localhost:5050, Mojaloop API at http://localhost:4040' })
}

async function ttkClient() {
    const router = require('@mojaloop/ml-testing-toolkit-client-lib/src/router')
    router.cli({
        mode: 'outbound',
        reportFormat: 'json',
        baseURL: 'http://localhost:5050',
        logLevel: '2',
        reportName: 'report',
        reportAutoFilenameEnable: false,
        breakRunOnError: false,
        saveReport: false,
        saveReportBaseUrl: null,
        extraSummaryInformation: '',
        environmentFile: require.resolve('./hub.json'),
        inputFiles: [
            resolve(__dirname, '../testing-toolkit-test-cases/collections/hub/provisioning/for_golden_path')
        ].join(',')
    })
}

async function alsMsisdnOracle() {
    const oracle = require('@mojaloop/als-msisdn-oracle-svc').default.server
    await oracle.run({
        PORT: 4003,
        HOST: 'localhost',
    })
}

async function main() {
    await alsMsisdnOracle()
    await agreement()
    await ledger()
    await adapter()
    await discovery()
    await ttk()
    await ttkClient()
}

main().catch(console.error)
