import { Request, Response } from 'express';
const { consoleLog, serverLog } = require('../logs/createLogger')

import pool from '../database';
import { getDateStrFromDateObj, getEditTSAccessRecords, timeFormat, timeHMS, getCurrentTimeStamp, getCalcDateTime } from '../helpers/commonFunctions'
class TimesheetController {

    public async getDatesToFillTS(req: Request, res: Response): Promise<any> {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    var reqJsonObj: any = {}
                    reqJsonObj = req.body
                    getEditTSAccessRecords(connection, reqJsonObj, function (result: any) {
                        return res.json({
                            data: result,
                            statusCode: 200
                        });
                    })
                    connection.release();
                }
            });
        });
    }

    public async getOne(req: Request, res: Response): Promise<any> {
        const { id } = req.params;
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query('SELECT * FROM time_sheet WHERE timesheet_id = ?', [id], function (err: any, result: any, fields: any) {
                        if (!err) {
                            var reqJsonObj: any = {}
                            reqJsonObj["presentDate"] = new Date(getDateStrFromDateObj(result[0]["entry_date"]))
                            reqJsonObj["localeTimeOffset"] = req.body["localeTimeOffset"]
                            getEditTSAccessRecords(connection, reqJsonObj, function (datesRangeJson: any) {
                                if (result.length > 0) {
                                    if (!((new Date(getDateStrFromDateObj(result[0]["entry_date"])) >= datesRangeJson["from"]) && (new Date(getDateStrFromDateObj(result[0]["entry_date"])) <= datesRangeJson["to"]))) {
                                        return res.json({
                                            message: "Timesheet cannot be seen.",
                                            statusCode: 501
                                        });
                                    }
                                    else {
                                        var store = new Date(getDateStrFromDateObj(result[0]["entry_date"]))
                                        result[0]["start_time"] = new Date(getDateStrFromDateObj(result[0]["entry_date"]) + " " + result[0]["start_time"])
                                        result[0]["end_time"] = new Date(getDateStrFromDateObj(result[0]["entry_date"]) + " " + result[0]["end_time"])
                                        result[0]["entry_date"] = store
                                        return res.json({
                                            data: result[0],
                                            statusCode: 200
                                        });
                                    }
                                }
                                else {
                                    return res.json({
                                        message: "The timesheet does not exist!",
                                        statusCode: 501
                                    });
                                }
                            })
                        }
                        if (err) {
                            serverLog.error("In getOne err:", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });
    }

    public async create(req: Request, res: Response) {
        delete req.body.timesheet_id;
        delete req.body.date;
        serverLog.info("In create timesheet", req.body)
        req.body.start_time = await timeFormat(req.body.actualStartTime)
        req.body.end_time = await timeFormat(req.body.actualEndTime)
        req.body.entry_date = getDateStrFromDateObj(new Date(req.body.entry_date))

        delete req.body.actualStartTime
        delete req.body.actualEndTime

        var localeTimeOffset = req.body.localeTimeOffset
        delete req.body.localeTimeOffset

        serverLog.info("final reqBody", req.body)
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(async function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        try {
                            var reqJsonObj: any = {}
                            reqJsonObj["presentDate"] = new Date(req.body.entry_date)
                            reqJsonObj["localeTimeOffset"] = localeTimeOffset
                            getEditTSAccessRecords(connection, reqJsonObj, async function (datesRangeJson: any) {
                                if (!((new Date((req.body.entry_date)) >= datesRangeJson["from"]) && (new Date((req.body.entry_date)) <= datesRangeJson["to"]))) {
                                    return res.json({
                                        message: "Timesheet cannot be created,Please check entered date.",
                                        statusCode: 501
                                    });
                                }
                                else {
                                    var presentDate = resObj["date"]
                                    req.body.created_date = presentDate
                                    req.body.updated_date = presentDate

                                    var objList = [req.body.user_id, req.body.entry_date]
                                    await connection.query(`SELECT * from time_sheet where user_id=? and entry_date=?  `, objList, async function (err: any, result: any, fields: any) {
                                        if (err) {
                                            serverLog.error("In create err:", err)
                                            return res.json({ message: 'Error occured', statusCode: 500 });
                                        } else {
                                            if (result.length > 0) {
                                                var flag = false
                                                for (var i = 0; i < result.length; i++) {
                                                    if (
                                                        (req.body.start_time <= result[i]['start_time'] && req.body.end_time <= result[i]['start_time'])
                                                        ||
                                                        (req.body.start_time >= result[i]['end_time'] && req.body.end_time >= result[i]['end_time'])
                                                    ) {
                                                        serverLog.info("pass")
                                                    }
                                                    else {
                                                        flag = true
                                                        serverLog.info("failed", result[i]['start_time'], "end ", result[i]['end_time'])
                                                        break
                                                    }
                                                }
                                                if (flag) {
                                                    return res.json({ message: 'Timesheet already exist,Please check start and end time!', statusCode: 501 });
                                                }
                                                else {
                                                    await connection.query('INSERT INTO time_sheet set ?', [req.body]);
                                                    await connection.query("COMMIT");
                                                    return res.json({ message: 'Timesheet saved successfully!', statusCode: 200 });
                                                }
                                            }
                                            if (result.length == 0) {
                                                await connection.query('INSERT INTO time_sheet set ?', [req.body]);
                                                await connection.query("COMMIT");
                                                return res.json({ message: 'Timesheet saved successfully!', statusCode: 200 });
                                            }
                                        }
                                    })
                                }
                            })
                        }
                        catch (err) {
                            serverLog.error("In create err mode on:", err);
                            throw new Error(err)
                        }

                        connection.release();
                    })
                }
            });
        });
    }

    public async update(req: Request, res: Response) {
        serverLog.info("In update timesheet", req.body)
        req.body.start_time = await timeFormat(req.body.actualStartTime)
        req.body.end_time = await timeFormat(req.body.actualEndTime)
        req.body.entry_date = getDateStrFromDateObj(new Date(req.body.entry_date))
        delete req.body.actualStartTime
        delete req.body.actualEndTime

        var localeTimeOffset = req.body.localeTimeOffset
        delete req.body.localeTimeOffset

        serverLog.info("final reqBody", req.body)

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(async function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    const { id } = req.params;
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        try {
                            var presentDate = resObj["date"]
                            req.body.updated_date = presentDate
                            var objList = [req.body.user_id, req.body.entry_date]
                            var updatedList = [req.body.start_time, req.body.end_time, req.body.project_id, req.body.description, req.body.duration, presentDate, req.body.entry_date, id]
                            var reqJsonObj: any = {}
                            reqJsonObj["presentDate"] = req.body.entry_date
                            reqJsonObj["localeTimeOffset"] = localeTimeOffset
                            getEditTSAccessRecords(connection, reqJsonObj, async function (datesRangeJson: any) {
                                if (!((new Date((req.body.entry_date)) >= datesRangeJson["from"]) && (new Date((req.body.entry_date)) <= datesRangeJson["to"]))) {
                                    return res.json({
                                        message: "Timesheet cannot be updated,Please check entered date.",
                                        statusCode: 501
                                    });
                                }
                                else {
                                    await connection.query(`SELECT * from time_sheet where user_id=? and entry_date=?  `, objList, async function (err: any, result: any, fields: any) {
                                        if (err) {
                                            serverLog.error("In update TS err:", err)
                                            return res.json({ message: 'Error occured', statusCode: 500 });
                                        } else {
                                            if (result.length > 0) {
                                                var flag = false
                                                for (var i = 0; i < result.length; i++) {
                                                    if (result[i]['timesheet_id'] == req.body.timesheet_id) {
                                                        //skipping for existing record
                                                        // serverLog.info("in this")
                                                        // flag = false
                                                        // break
                                                    }
                                                    else if (
                                                        (req.body.start_time <= result[i]['start_time'] && req.body.end_time <= result[i]['start_time'])
                                                        ||
                                                        (req.body.start_time >= result[i]['end_time'] && req.body.end_time >= result[i]['end_time'])
                                                    ) {
                                                        serverLog.info("pass")
                                                    }
                                                    else {
                                                        flag = true
                                                        serverLog.info("failed", result[i]['start_time'], "end ", result[i]['end_time'])
                                                        break
                                                    }
                                                }
                                                if (flag) {
                                                    // dont insert n send neg msg
                                                    return res.json({ message: 'Timesheet already exist,Please check start and end time!', statusCode: 501 });
                                                }
                                                else {
                                                    //  update n success msg  
                                                    await connection.query(`UPDATE time_sheet set start_time=?,end_time=?,project_id=?,description=?,duration=?,updated_date=?,entry_date=? WHERE timesheet_id = ?`, updatedList);
                                                    await connection.query("COMMIT");
                                                    return res.json({ message: 'The timesheet was updated!' + req.params.id, statusCode: 200 });
                                                }
                                            }
                                            if (result.length == 0) {
                                                await connection.query(`UPDATE time_sheet set start_time=?,end_time=?,project_id=?,description=?,duration=?,updated_date=?,entry_date=? WHERE timesheet_id = ?`, updatedList);
                                                await connection.query("COMMIT");
                                                return res.json({ message: 'The timesheet was updated!' + req.params.id, statusCode: 200 });
                                            }
                                        }
                                    })
                                }
                            })
                        }
                        catch (err) {
                            serverLog.error("In update TS err mode on:", err);
                            throw new Error(err)
                        }

                        connection.release();
                    })
                }
            });

        });
    }

    public async getDayWiseData(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        var query = ""
        query = `SELECT ts.timesheet_id,ts.start_time,ts.end_time,ts.duration,ts.description,ts.entry_date,proj.project_name
            FROM time_sheet as ts
            INNER JOIN projects as proj on proj.id=ts.project_id
            where ts.user_id = ? and (entry_date BETWEEN ? and ? ) order by ts.entry_date,ts.start_time;`
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query(query, [id, req.body.start_date, req.body.end_date], async function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("In getDayWiseData", err)
                            return res.json({ error: "queryErr " + err, statusCode: 500 })
                        }
                        if (!err) {
                            var durSec: any = 0
                            var reqTSJson: any = {}
                            reqTSJson["presentDate"] = req.body.presentDate
                            reqTSJson["localeTimeOffset"] = req.body["localeTimeOffset"]
                            getEditTSAccessRecords(connection, reqTSJson, function (datesRangeJson: any) {
                                if (result.length > 0) {
                                    result.filter((ele: any, idx: any) => {

                                        result[idx]["edit_flag"] = true
                                        if ((new Date(getDateStrFromDateObj(result[idx]["entry_date"])) >= datesRangeJson["from"]) && (new Date(getDateStrFromDateObj(result[idx]["entry_date"])) <= datesRangeJson["to"])) {
                                            result[idx]["edit_flag"] = false
                                        }

                                        var store = new Date(getDateStrFromDateObj(result[idx]["entry_date"]))
                                        result[idx]["start_time"] = new Date(getDateStrFromDateObj(result[idx]["entry_date"]) + " " + result[idx]["start_time"])
                                        result[idx]["end_time"] = new Date(getDateStrFromDateObj(result[idx]["entry_date"]) + " " + result[idx]["end_time"])
                                        result[idx]["entry_date"] = store

                                        durSec += result[idx]["duration"]
                                    })
                                }
                                serverLog.info("In getDayWiseData", result)
                                res.json({
                                    data: result,
                                    time: durSec / 60,
                                    statusCode: 200
                                });
                            })
                        }
                    })
                    connection.release();
                }
            });
        });

    }

    public async getDateRanger(req: Request, res: Response): Promise<void> {
        var { id }: any = req.params;
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCalcDateTime(connection, { offset: req.body["localeTimeOffset"] }, async function (resObj: any) {
                        id = resObj["date"]
                        connection.query(`SELECT WEEKDAY(?) as week`, [id], async function (err: any, result: any, fields: any) {
                            var queryStr: any = `SELECT  
                        ? as today,
(?- INTERVAL 1  DAY) as yesterday ,
(?- INTERVAL ( WEEKDAY(?)+1 ) DAY ) as thisweekSun,
(?- INTERVAL ( WEEKDAY(?)+0 ) DAY ) as thisweekMon,
(? - INTERVAL ( WEEKDAY(?)-4 ) DAY)  as thisWeekFri,
(? - INTERVAL ( WEEKDAY(?)-5 ) DAY)  as thisWeekSat,
(? - INTERVAL ( WEEKDAY(?)+8 ) DAY)  as lastweekSun,
(? - INTERVAL ( WEEKDAY(?)+7 ) DAY)  as lastweekMon,
(? - INTERVAL ( WEEKDAY(?)+3 ) DAY)  as lastweekFri,
(? - INTERVAL ( WEEKDAY(?)+2 ) DAY)  as lastweekSat;`
                            if (!err) {
                                var week = result[0]['week']
                                serverLog.info("week", week)
                                var idCount: any = 18
                                var options: any = []
                                for (var i = 0; i < idCount; i++) {
                                    options.push(id)
                                }
                                connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
                                    if (!err) {
                                        // Object.keys(result[0]).filter((eachKey: any) => {
                                        //     result[0][eachKey] = new Date(result[0][eachKey])
                                        // })
                                        // result[0]["today"] = new Date(result[0]["today"])
                                        // result[0]["yesterday"] = new Date(result[0]["yesterday"])
                                        serverLog.info("getDateRanger result", result)
                                        res.json({ data: result[0], statusCode: 200 });
                                    }
                                    if (err) {
                                        serverLog.error("In getDateRanger err:", err)
                                        return res.json({ data: "Error occured", statusCode: 500 });
                                    }
                                })
                            }
                            if (err) {
                                serverLog.error("In getDateRanger err:", err)
                                return res.json({ data: "Error occured", statusCode: 500 });
                            }
                        })
                        connection.release();
                    })
                }
            });
        });
    }

}

const timesheetController = new TimesheetController();
export default timesheetController;
