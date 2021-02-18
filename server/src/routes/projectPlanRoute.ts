import { Router } from 'express';
import { projectPlanController } from '../controllers/projectPlanNewController'

class ProjectPlanRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        this.router.post("/getProjectPlan/", projectPlanController.getProjectHours)
        this.router.post("/assignHours/", projectPlanController.assignHours)
    }
}

const projectPlanRoutes = new ProjectPlanRoutes();
export default projectPlanRoutes.router