import { Router } from 'express';
import reportController from '../controllers/reportController';
import commonController from '../controllers/commonController';

class ReportRoutes{

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {

        //user reports
        this.router.post('/getUserTimesheetSummary', reportController.getUserTSReport);
        this.router.post('/getUserProjectSummary', reportController.getUserProjReport);

        //manager report
        this.router.post('/getManagerReport', reportController.getManagerReport);

        //admin reports
        this.router.post('/getAdminSummaryReport', reportController.getAdminSummaryReport);
        this.router.post('/getAdminDetailedReport', reportController.getAdminDetailedReport);
        this.router.post('/getAdminAvailableReport', reportController.getAdminAvailableReport);
    }

}

const reportRoutes = new ReportRoutes();
export default reportRoutes.router