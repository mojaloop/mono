process.env.PEER_ENDPOINT ||= 'localhost'
process.env.BACKEND_ENDPOINT ||= 'localhost:3010'
process.env.BACKEND_EVENT_CONSUMER_BROKER_LIST ||= 'host.docker.internal:9092'
process.env.BACKEND_EVENT_PRODUCER_BROKER_LIST ||= 'host.docker.internal:9092'
process.env.FSPIOP_EVENT_CONSUMER_BROKER_LIST ||= 'host.docker.internal:9092'
process.env.FSPIOP_EVENT_PRODUCER_BROKER_LIST ||= 'host.docker.internal:9092'
process.env.ALS_MSISDN_ORACLE_DATABASE_HOST ||= 'host.docker.internal'
process.env.ALS_MSISDN_ORACLE_DATABASE_USER ||= 'hub'
process.env.JWS_SIGNING_KEY_PATH ||= __dirname + '/sign.key'
process.env.API_TYPE ||= 'iso20022'
process.env.FEE_MULTIPLIER ||= '0.05'
process.env.ILP_VERSION ||= '4'

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
        reportFormat: 'html',
        baseURL: 'http://localhost:5050',
        logLevel: '2',
        reportName: 'report',
        reportAutoFilenameEnable: false,
        breakRunOnError: false,
        saveReport: false,
        saveReportBaseUrl: null,
        extraSummaryInformation: '',
        environmentFile: require.resolve('./hub.json'),
        labels: 'prod-tests',
        inputFiles: [
            resolve(__dirname, '../testing-toolkit-test-cases/collections/hub/golden_path/feature_tests/p2p_money_transfer')
            // resolve(__dirname, '../testing-toolkit-test-cases/collections/hub/provisioning/for_golden_path')
        ].join(',')
    })
}

async function alsMsisdnOracle() {
    const oracle = require('@mojaloop/als-msisdn-oracle-svc').default.server
    await oracle.run({
        PORT: 4003,
        HOST: '0.0.0.0',
    })
}

async function simulator() {
    const simulator = require('mojaloop-simulator')
    await simulator({
        // CA_CERT_PATH : '/secrets/cacert.pem',
        MULTI_DFSP : true,
        FEE_MULTIPLIER : 0.05,
        HTTPS_ENABLED : 'false',
        LOG_INDENT : 0,
        MODEL_DATABASE : ':memory:',
        MUTUAL_TLS_ENABLED : 'false',
        OUTBOUND_ENDPOINT : 'http://moja-sim-testfsp1-scheme-adapter:4001',
        REPORT_API_LISTEN_PORT : 3012,
        RULES_FILE : require.resolve('./rules.json'),
        SCHEME_NAME : 'moja-sim-testfsp1',
        SIMULATOR_API_LISTEN_PORT : 3010,
        SIM_NAME : 'payeefsp',
        SQLITE_LOG_FILE : ':memory:',
        TEST_API_LISTEN_PORT : 3011,
        // SERVER_CERT_PATH : '/secrets/servercert.pem',
        // SERVER_KEY_PATH : '/secrets/serverkey.pem',
        // SIM_BACKEND_SERVICE_NAME : 'sim-payeefsp-backend',
        // SIM_CACHE_SERVICE_NAME : 'sim-payeefsp-cache',
        // SIM_SCHEME_ADAPTER_SERVICE_NAME : 'sim-payeefsp-scheme-adapter',
    })
}

async function sdk() {
    const {start, config} = require('@mojaloop/sdk-scheme-adapter-api-svc')
    await start({
        ...config,
        multiDfsp: true,
        alsEndpoint: 'localhost:4012',
        quotesEndpoint: 'localhost:3002',
        fxQuotesEndpoint: 'localhost:3002',
        transfersEndpoint: 'localhost:3000',
        fxTransfersEndpoint: 'localhost:3000',
        cacheUrl: 'redis://host.docker.internal:6379',
        validateInboundJws: false,
        enableTestFeatures: true
    })
}

async function main() {
    await Promise.all([
        alsMsisdnOracle(),
        agreement(),
        ledger(),
        adapter(),
        discovery(),
        ttk(),
        simulator(),
        sdk()
    ])
    console.log('All services started')
    await ttkClient()
}

main().catch(console.error)
