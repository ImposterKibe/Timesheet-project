import { Request, Response, json } from 'express';
import pool from '../database';

import { getUsrProjCatList, getTotBillHrsList, getUnAccountedHrs, getActualPlannedHrs, getUsrLinkedToProj, getUsrTSReportFormat, getAdDetReportFormat, userReportFormat, adminReportFormat } from '../helpers/reportNewHelper'
import { checkParams, arrayToJsonUsers, getWeeksBtwDates, getUserNames, getLeavesDataForEachUsers, getNumberOfWorkingDays, getAvailableHrForUsrWeek } from '../helpers/commonFunctions'
import commonController from '../controllers/commonController';
const { consoleLog, serverLog } = require('../logs/createLogger')

class ReportController {

    public async getUserTSReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1, 2, 3] }, function () {
            checkParams(req, res, ["user_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                        } else {
                            var jsonObj = req.body
                            if (typeof (jsonObj['user_id']) == 'string') {
                                (jsonObj['user_id']) = [(jsonObj['user_id'])]
                            }

                            //For users timesheet summary table
                            var detailsJson: any = {
                                "100": "Available Hours",
                                "1": "Billable Hours",
                                "2": "QTA Development",
                                "3": "Pre-sales",
                                "4": "Internal Engineering",
                                "5": "Competency",
                                "6": "Non-Billable Hours",
                                "10": "Unaccounted"
                            }
                            var finalResArr: any = []
                            getWeeksBtwDates(connection, jsonObj, function (weekResult: any) {
                                jsonObj["yearWeekJson"] = weekResult
                                getTotBillHrsList(connection, jsonObj, function (billResult: any) {
                                    finalResArr = billResult
                                    weekResult.filter((eachBlk: any, idx: any) => {
                                        jsonObj['year'] = eachBlk['year']
                                        jsonObj['week'] = eachBlk['weeks']
                                        getUsrProjCatList(connection, jsonObj, function (catResult: any) {
                                            getUnAccountedHrs(connection, jsonObj, function (unAccresult: any) {
                                                var finRes: any = unAccresult.concat(catResult)
                                                finalResArr = finalResArr.concat(finRes)
                                                if (idx == (weekResult.length - 1)) {
                                                    arrayToJsonUsers({ "data": finalResArr }, function (usersDetJson: any) {
                                                        var reqJsonFields: any = {}
                                                        reqJsonFields['user_id'] = jsonObj['user_id']
                                                        reqJsonFields['usersDetJson'] = usersDetJson
                                                        reqJsonFields['detailsJson'] = detailsJson
                                                        getUsrTSReportFormat(reqJsonFields, function (resultAns: any) {
                                                            var tempRes: any = []
                                                            tempRes.push(resultAns.pop())
                                                            resultAns.filter((eachEle: any) => {
                                                                tempRes.push(eachEle)
                                                            })

                                                            connection.release();
                                                            return res.json({
                                                                "statusCode": 200,
                                                                "data": tempRes
                                                            })
                                                        })
                                                    })
                                                }
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    })
                })
            })
        })
    }

    public async getUserProjReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1, 2, 3] }, function () {
            checkParams(req, res, ["user_id", "project_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {                  //Transaction Error (Rollback and release connection)
                            connection.rollback(function () {
                                connection.release();
                                //Failure
                            });
                        } else {

                            var jsonObj = req.body

                            getWeeksBtwDates(connection, jsonObj, function (weeksResult: any) {
                                var finalResArr: any = []
                                weeksResult.filter((eachBlck: any, idx: any) => {
                                    jsonObj['year'] = eachBlck['year']
                                    jsonObj['week'] = eachBlck['weeks']
                                    getActualPlannedHrs(connection, jsonObj, function (userResult: any) {
                                        finalResArr = finalResArr.concat(userResult)
                                        if (idx == (weeksResult.length - 1)) {
                                            userReportFormat(finalResArr, function (result: any) {
                                                connection.release();
                                                return res.json({
                                                    "statusCode": 200,
                                                    "data": result['chart']
                                                })
                                            })
                                        }
                                    })
                                })
                            })
                        }
                    })
                })
            })
        })
    }

    public async getManagerReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1, 2] }, function () {
            checkParams(req, res, ["project_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {                  //Transaction Error (Rollback and release connection)
                            connection.rollback(function () {
                                connection.release();
                                //Failure
                            });
                        } else {

                            var jsonObj = req.body

                            getWeeksBtwDates(connection, jsonObj, function (weeksResult: any) {
                                var finalResArr: any = []
                                getUsrLinkedToProj(connection, jsonObj, function (userIdList: any) {
                                    jsonObj['user_id'] = userIdList
                                    weeksResult.filter((eachBlck: any, idx: any) => {
                                        jsonObj['year'] = eachBlck['year']
                                        jsonObj['week'] = eachBlck['weeks']
                                        getActualPlannedHrs(connection, jsonObj, function (userResult: any) {
                                            finalResArr = finalResArr.concat(userResult)
                                            if (idx == (weeksResult.length - 1)) {
                                                userReportFormat(finalResArr, function (result: any) {
                                                    connection.release()
                                                    return res.json({
                                                        "statusCode": 200,
                                                        "data": result
                                                    })
                                                })
                                            }
                                        })
                                    })
                                })
                            })
                        }
                    })
                })
            })
        })
    }

    public async getAdminSummaryReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1] }, function () {
            checkParams(req, res, ["user_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {                  //Transaction Error (Rollback and release connection)
                            connection.rollback(function () {
                                connection.release();
                                //Failure
                            });
                        }
                        else {

                            var jsonObj = req.body
                            jsonObj['summRep'] = true   //dont remove this line

                            var catgDetJson: any = {
                                "1": "Billable Hours Consumed",
                                "2": "QTA Delevopment Efforts",
                                "3": "Pre-Sales efforts(Non-LATAM)",
                                "4": "Internal Engg.Efforts",
                                "5": "Competency Efforts",
                                "6": "Non-Billable Hours",
                                "10": "Unaccounted Hours",
                                "100": "Total Available Billable Hours",
                            }

                            getWeeksBtwDates(connection, jsonObj, function (weeksResult: any) {
                                var finalArrRes: any = []
                                jsonObj["yearWeekJson"] = weeksResult
                                getTotBillHrsList(connection, jsonObj, function (billResult: any) {
                                    finalArrRes = billResult
                                    weeksResult.filter((eachBlck: any, idx: any) => {
                                        jsonObj['year'] = eachBlck['year']
                                        jsonObj['week'] = eachBlck['weeks']

                                        getUsrProjCatList(connection, jsonObj, function (catResult: any) {
                                            getUnAccountedHrs(connection, jsonObj, function (unAccresult: any) {
                                                var finRes: any = (unAccresult.concat(catResult))
                                                finalArrRes = finalArrRes.concat(finRes)
                                                if (idx == (weeksResult.length - 1)) {
                                                    var reqJsonObjData: any = {}
                                                    reqJsonObjData['finRes'] = finalArrRes
                                                    reqJsonObjData['catgDetJson'] = catgDetJson
                                                    adminReportFormat(reqJsonObjData, function (resJson: any) {
                                                        connection.release()

                                                        var tempRes: any = []
                                                        tempRes.push(resJson.pop())
                                                        resJson.filter((eachEle: any) => {
                                                            tempRes.push(eachEle)
                                                        })

                                                        return res.json({
                                                            "statusCode": 200,
                                                            "data": tempRes
                                                        })
                                                    })
                                                }
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    });
                });
            })
        })
    }

    public async getAdminDetailedReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1] }, function () {
            checkParams(req, res, ["user_id", "start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                        }
                        else {

                            var jsonObj = req.body

                            var columnsJsonDet: any = {
                                // "user_name": "user_name",    //dont uncomment
                                "1": "billable_hrs",
                                "2": "qta_dev",
                                "3": "pre_sales",
                                "4": "internal_engg",
                                "5": "competency",
                                "6": "non_billable_hrs",
                                "10": "unaccounted_hrs",
                                "100": "net_available_hrs",
                                // "utilization": "billable_utilization",   //dont uncomment
                            }
                            var finalArrRes: any = []
                            getUserNames(connection, jsonObj, function (userResult: any) {
                                getWeeksBtwDates(connection, jsonObj, function (weeksResult: any) {
                                    jsonObj["yearWeekJson"] = weeksResult
                                    getLeavesDataForEachUsers(connection, jsonObj, function (leavesDaysJson: any) {
                                        // return res.json({"leavesInfo":leavesDaysJson})
                                        getNumberOfWorkingDays(connection, jsonObj, function (workingDaysJson: any) {
                                            // return res.json({ "data": workingDaysJson })
                                            getTotBillHrsList(connection, jsonObj, function (billResult: any) {
                                                finalArrRes = billResult
                                                weeksResult.filter((eachBlck: any, idx: any) => {
                                                    jsonObj['year'] = eachBlck['year']
                                                    jsonObj['week'] = eachBlck['weeks']

                                                    getUsrProjCatList(connection, jsonObj, function (catResult: any) {
                                                        getUnAccountedHrs(connection, jsonObj, function (unAccresult: any) {
                                                            var finRes: any = (unAccresult.concat(catResult))
                                                            finalArrRes = finalArrRes.concat(finRes)
                                                            if (idx == weeksResult.length - 1) {
                                                                arrayToJsonUsers({ "data": finalArrRes }, function (usersDetJson: any) {
                                                                    // return res.json({ "data": usersDetJson })
                                                                    var reqJsonObj: any = {}
                                                                    reqJsonObj['columnsJsonDet'] = columnsJsonDet
                                                                    reqJsonObj['usersDetJson'] = usersDetJson
                                                                    reqJsonObj['userResult'] = userResult
                                                                    reqJsonObj['workingDaysJson'] = workingDaysJson
                                                                    reqJsonObj['leavesDaysJson'] = leavesDaysJson
                                                                    reqJsonObj['user_id'] = jsonObj['user_id']
                                                                    getAdDetReportFormat(reqJsonObj, function (resultAns: any) {
                                                                        connection.release()
                                                                        return res.json({
                                                                            "statusCode": 200,
                                                                            "data": resultAns
                                                                        })
                                                                    })
                                                                })
                                                            }
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    });
                });
            })
        })
    }

    public async getAdminAvailableReport(req: Request, res: Response) {
        commonController.checkAuthentication(req, res, { "roles": [1] }, function () {
            checkParams(req, res, ["start_date", "end_date"], function () {
                pool.getConnection(function (err: any, connection: any) {
                    connection.beginTransaction(function (err: any) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                        }
                        else {
                            var jsonObj: any = req.body

                            getAvailableHrForUsrWeek(connection, jsonObj, function (result: any) {
                                return res.json(result)
                            })
                        }
                    })
                })
            })
        })
    }
}


const reportController = new ReportController();
export default reportController;