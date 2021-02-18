import { Router } from 'express';
import timesheetController from '../controllers/timesheetController';

class TimesheetRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        this.router.post('/getDatesToFillTS', timesheetController.getDatesToFillTS);

        this.router.post('/onesheet/:id', timesheetController.getOne);
        this.router.post('/addtimesheet', timesheetController.create);
        this.router.put('/updatetimesheet/:id', timesheetController.update);

        this.router.post('/getDayWiseData/:id', timesheetController.getDayWiseData);
        this.router.post('/getDateRanger/:id', timesheetController.getDateRanger);
    }

}

const timesheetRoutes = new TimesheetRoutes();
export default timesheetRoutes.router