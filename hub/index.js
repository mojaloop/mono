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

function action(what, options, command) {
    if (options.otel) {
        process.env.OTEL_LOGS_EXPORTER ||= 'none'
        // process.env.OTEL_TRACES_EXPORTER ||= 'none'
        process.env.OTEL_METRICS_EXPORTER ||= 'none'
        process.env.OTEL_SERVICE_NAME ||= 'hub'
        process.env.OTEL_TRACES_SAMPLER ||= 'always_on'
        process.env.OTEL_RESOURCE_ATTRIBUTES ||= 'service.name=hub'
        process.env.OTEL_PROPAGATORS ||= 'tracecontext,baggage'
        require('@opentelemetry/auto-instrumentations-node/register')
    }
    return require('./action')(what, options, command.name())
}

if (require.main === module) {
    const { program } = require('commander');
    const addServiceFlags = program => program
        .option('-o, --oracle', 'Start the oracle service')
        .option('-d, --discovery', 'Start the discovery service')
        .option('-a, --agreement', 'Start the agreement service')
        .option('-l, --ledger', 'Start the ledger service')
        .option('-r, --adapter', 'Start the adapter service')
        .option('-t, --ttk', 'Start the testing toolkit service')
        .option('-s, --simulator', 'Start the simulator service')
        .option('-k, --sdk', 'Start the sdk service')
        .option('--otel', 'Enable OpenTelemetry')

    addServiceFlags(program
        .command('start [what]')
        .description('Start the Mojaloop Hub')
        .action(action)
    )

    addServiceFlags(program
        .command('test <what>')
        .description('Run the Mojaloop Hub tests')
        .action(action)
    )

    program.parseAsync(process.argv)
} else module.exports = require('./action')