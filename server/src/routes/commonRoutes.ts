import { Router } from 'express';
import commonController from '../controllers/commonController';

class commonRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        this.router.post('/login', commonController.login);
        this.router.post('/logout', commonController.logout);
        this.router.post('/resetPassword', commonController.resetPassword);
        this.router.post('/forgotPassword', commonController.sendMail);
        this.router.post('/checkToken', commonController.checkToken);
        this.router.post('/changePassword', commonController.checkSession, commonController.changePassword);
        this.router.get('/getServerTime', commonController.checkSession, commonController.getServerTime);
        this.router.post('/getAllDurations/:id', commonController.checkSession, commonController.getAllDurations);
        this.router.get('/getDateList', commonController.checkSession, commonController.getDateList);

        this.router.post('/getAllProjForReportOrPlanning', commonController.getAllProjForReportOrPlanning);
    }

}

const commonRouters = new commonRoutes();
export default commonRouters.router