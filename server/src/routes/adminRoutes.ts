import { Router } from 'express';
import adminController from '../controllers/adminController';

class AdminRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {

        //both manager n admin        
        this.router.get('/getAllProjCatg', adminController.getAllProjCatg);
        this.router.get('/getAllCustomerNames', adminController.getAllCustomerNames);
        this.router.get('/getServiceLines', adminController.getServiceLines);
        this.router.get('/getProTypes', adminController.getProTypes);
        this.router.get('/getProjManagers', adminController.getProjManagers);

        //both manager n admin
        this.router.get('/allusers', adminController.userlist);
        this.router.get('/oneuser/:id', adminController.getOneUser);
        this.router.post('/adduser', adminController.createUser);
        this.router.put('/updateuser/:id', adminController.updateUser);
        this.router.put('/deleteuser/:id', adminController.deleteUser);
        //both manager n admin
        this.router.get('/allprojects/:id/:role', adminController.prolist);
        //both manager n admin
        this.router.get('/getverifiedPro/:uid/:pid', adminController.getverifiedPro);
        this.router.get('/oneproject/:id', adminController.getOnePro);
        this.router.post('/addproject', adminController.createProject);//add project
        this.router.put('/projects/:id', adminController.updateSingleProject);//update project
        this.router.put('/deleteproject/:id', adminController.deleteproject);//delete project
        this.router.get('/roles', adminController.rolelist);
        this.router.get('/getLatestProiD/:custId/:PtypeId', adminController.getLatestProiD);

        //admin/timesheets 
        this.router.post('/getSpecData', adminController.specficDatalist);

        //customer api
        this.router.get('/getAllCustomers', adminController.getAllCustomers);
        this.router.get('/getOneCustomer/:id', adminController.getSingleCustomer);
        this.router.post('/updateCustomer', adminController.updateCustomer);
        this.router.post('/addNewCustomer', adminController.addNewCustomer);
    }

}

const adminRoutes = new AdminRoutes();
export default adminRoutes.router