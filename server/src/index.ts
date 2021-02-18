import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from "express-session";


import indexRoutes from './routes/indexRoutes';
import timesheetRoutes from './routes/timesheetRoutes';
import adminRoutes from './routes/adminRoutes';

import commonRoutes from './routes/commonRoutes';

const { consoleLog, serverLog } = require('./logs/createLogger')

import CommonController from './controllers/commonController'
import projectPlanRoutes from './routes/projectPlanRoute'

import reportRoutes from './routes/reportRoutes'

import store from './serverConfig'
import commonController from './controllers/commonController';


class Server {

    public app: Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    config(): void {
        this.app.set('port', process.env.PORT || store.sessionInfo.serverPort);
        this.app.use(morgan('dev'));
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));

        this.app.use(session({
            secret: store.sessionInfo.sessionKey,
            resave: true,
            saveUninitialized: true,
            cookie: { maxAge: store.sessionInfo.maxAge } //3hrs
        }));
    }

    routes(): void {
        this.app.use('/', indexRoutes);
        this.app.use('/api/common', CommonController.checkDBConnection, commonRoutes);

        this.app.use('/api/timesheet', CommonController.checkSession, CommonController.checkDBConnection, timesheetRoutes);
        this.app.use('/api/admin', CommonController.checkSession, CommonController.checkDBConnection, adminRoutes);
        this.app.use('/api/projectPlan', CommonController.checkSession, CommonController.checkDBConnection, projectPlanRoutes)

        this.app.use('/api/report', CommonController.checkSession, CommonController.checkDBConnection, reportRoutes)
    }

    start(): void {
        this.app.listen(this.app.get('port'), () => {
            consoleLog.info('Server on port ', this.app.get('port'))
        })
    }
}

const server = new Server();
server.start();



