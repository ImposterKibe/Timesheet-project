export default {
    database: {
        host: '172.16.1.35',
        user: 'ts_user',
        password: 'Qtx@123',
        database: 'temp_ts2',
        timezone: 'Z',
        multipleStatements: true,
        connectionLimit: 1000,
        queueLimit: 0,
        waitForConnection: true,
        connectTimeout: 5 * 60 * 60 * 1000,
        acquireTimeout: 5 * 60 * 60 * 1000,
        timeout: 5 * 60 * 60 * 1000,
    },
    testDatabase: {
        host: '172.16.1.35',
        user: 'ts_user',
        password: 'Qtx@123',
        database: 'qtsdb_test',
        timezone: 'Z',
        multipleStatements: true,
        connectionLimit: 1000,
        queueLimit: 0,
        waitForConnection: true,
        connectTimeout: 5 * 60 * 60 * 1000,
        acquireTimeout: 5 * 60 * 60 * 1000,
        timeout: 5 * 60 * 60 * 1000,
    },
    Olddatabase: {
        host: '172.16.1.35',
        user: 'ksangeetha',
        password: 'ksangeetha@#987',
        database: 'time_sheet',
        timezone: 'Z',
        multipleStatements: true,
        connectionLimit: 1000,
        queueLimit: 0,
        waitForConnection: true,
        connectTimeout: 5 * 60 * 60 * 1000,
        acquireTimeout: 5 * 60 * 60 * 1000,
        timeout: 5 * 60 * 60 * 1000,
    },
    filePath: {
        serverLog: "./src/logs/serverLogger",
        consoleLog: "./src/logs/consoleLogger",
    },
    jwttoken: {
        "secretKey": "sangeethaK",
        "logInTokExpiresIn": "3d", //ex: m h d
    },
    sessionInfo: {
        "maxAge": 1000 * 60 * 60 * 3, //three hr
        //"maxAge": 1000 * 60 , //three hr
        "sessionKey": "sangeethaK",
        "serverPort": 3100,
    },
    argon2Params: {
        "timeCost": 256,
        "parallelism": 1,
        "memoryCost": 4000
    },
    mailData: {
        "secretKeyApp": "shsdfsdfyamkumar",
        "mailExpiresIn": '30m',
        "clientURL": "172.16.1.74:4900",
        "host": "smtp.zoho.com",
        "port": 465,
        "secure": true,
        // "userEmail": "qtx.support@quadratyx.com",
        // "password": "IrIqGA3aV5E3",
        "userEmail": "support@quadratyx.com",
        "password": "qwp7rjGirtVZ",
        "fromOption": '"support" <support@quadratyx.com>',

        "reset": {
            "title": "Password Reset | Timesheet",
        },
        "confirm": {
            "title": "Your password has been updated | Timesheet",
            "bodyText": `Your password has been updated for Timesheet Application by using a reset password link.
   
   If this change wasn't initiated by you, please contact your system administrator immediately.`,
            "confirmBodyText": `Your password has been updated for Timesheet Application.
   
   If this change wasn't initiated by you, please contact your system administrator immediately.`
        },
        "success": "Mail has been sent to the registered email.",
        "failure": "Server connection is lost. Please try again!"
    },
    dateRecord: {
        lastDay: 1
    },
    "specificFieldsInfo": {
        "basePassword": "qtx@123"
    }


}