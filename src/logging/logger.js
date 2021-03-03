const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

// https://github.com/winstonjs/winston#logging
// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const level = process.env.LOG_LEVEL || "debug"
const logsPath = process.env.LOGS_PATH
const morganFormat = process.env.LOG_ACCESS_FORMAT
const logsRotatePattern = process.env.LOGS_ROTATE_DATE_PATTERN

function formatParams(info) {
    const { timestamp, level, message, ...args } = info
    const ts = timestamp.slice(0, 19).replace("T", " ")

    return `${ts} ${level}: ${message} ${Object.keys(args).length
        ? JSON.stringify(args, "", "")
        : ""}`
}

// https://github.com/winstonjs/winston/issues/1135
const developmentFormat = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(formatParams)
);

const productionFormat = format.combine(
    format.timestamp(),
    format.align(),
    format.printf(formatParams)
);

let logger, accessLogger;


logger = createLogger({
    level: level,
    format: productionFormat,
    transports: [
        //new transports.File({ filename: logsPath + 'error.log', level: 'error'}),
        new DailyRotateFile({
            filename: logsPath + `error-%DATE%.log`,
            datePattern: logsRotatePattern,
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            prepend: true,
            level: 'error',
        })
    ]
});

accessLogger = createLogger({
    level: level,
    format: productionFormat,
    transports: [
        //new transports.File({ filename: logsPath + 'access.log'}),
        new DailyRotateFile({
            filename: logsPath + `access-%DATE%.log`,
            datePattern: logsRotatePattern,
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            prepend: true
        })
    ]
});


module.exports = logger;
module.exports.morganFormat = morganFormat;
module.exports.accessLogStream = {
    write: function(message, encoding){
        accessLogger.info(JSON.stringify(message))
    }
}
