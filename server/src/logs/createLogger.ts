const winston = require('winston');
import store from '../serverConfig'

const serverLogger = new(winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: store.filePath.serverLog,
            json: false,
            level: 'info',
            timestamp: function () {
                return new Date()
            }
        })
    ]
});

const consoleLogger = new(winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: function () {
                return new Date()
            }
        }),
        new (winston.transports.File)({
            filename: store.filePath.consoleLog,
            json: false,
            level: 'info',
            timestamp: function () {
                return new Date()
            }
        })
    ]
});


module.exports = {
    'serverLog': serverLogger,
    "consoleLog": consoleLogger
};