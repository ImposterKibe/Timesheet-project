import { Request, Response } from 'express';
import pool from '../database';
import { checkParams, getAssignHrForUsrWeek, saveAssignHrForUsrWeek } from "../helpers/commonFunctions"
import commonController from '../controllers/commonController';

class ProjectPlanController {

    public async getProjectHours(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1, 2] }, function () {
            checkParams(req, res, ["project_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                        } else {
                            var jsonObj: any = {}
                            jsonObj = req.body
                            getAssignHrForUsrWeek(connection, jsonObj, function (result: any) {
                                return res.json(result)
                            })
                        }
                    })
                })
            })
        })
    }

    public async assignHours(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1, 2] }, function () {
            checkParams(req, res, ["tableInfo", "project_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                        } else {
                            var jsonObj: any = {}
                            jsonObj = req.body;
                            saveAssignHrForUsrWeek(connection, jsonObj, function (result: any) {
                                return res.json(result)
                            })
                        }
                    });
                });
            })
        })
    }
}

export const projectPlanController = new ProjectPlanController();  