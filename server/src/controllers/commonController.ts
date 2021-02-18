import { Request, Response } from 'express';
import store from "../serverConfig"
import {
    getWeeksBtwDates, getDateStrFromDateObj, getProjForAdmin
    , getProjForManager, getProjForUsers, sendMailFunc,
    getCurrentTimeStamp
} from '../helpers/commonFunctions'

import pool from '../database';
import jwt from "jsonwebtoken"
const argon2 = require("argon2")
const { consoleLog, serverLog } = require('../logs/createLogger')

import nodemailer from 'nodemailer'
const argon2Data = store.argon2Params

var mailData = store.mailData
var dateLimit = store.dateRecord.lastDay

class CommonController {
    public async login(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query(`SELECT * FROM users
                    INNER join user_roles on user_roles.user_id=users.user_id
                    WHERE users.user_id = ?  AND users.status=1`, [req.body.user_id], async function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("ERROR CAME while login ", err.code, err.message);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        }
                        else {
                            if (result.length == 0) {
                                return res.json({
                                    message: 'Please enter valid user id.',
                                    statusCode: 500
                                });
                            }
                            else {
                                try {
                                    if (await argon2.verify(result[0].password, req.body.password)) {
                                        const payload = {
                                            userid: result[0].user_id,
                                            uname: result[0].user_name,
                                            role: result[0].role_id
                                        }

                                        let token = jwt.sign(payload, store.jwttoken.secretKey, {
                                            expiresIn: store.jwttoken.logInTokExpiresIn
                                        })
                                        if (req.session) {
                                            req.session.user = result[0]['user_id'];
                                            req.session.token = token;
                                            req.session.save(() => {
                                                return res.json({
                                                    res: result,
                                                    token: token,
                                                });
                                            });
                                        }
                                        else {
                                            return res.json({ "res": result, "token": token });
                                        }
                                    } else {
                                        return res.json({
                                            message: 'Please enter valid password.',
                                            statusCode: 500
                                        });
                                    }
                                }
                                catch (err) {
                                    res.json({
                                        message: 'err: ' + err.message,
                                        statusCode: 500
                                    });
                                }
                            }
                        }
                    })
                    connection.release();
                }
            });
        });

    }

    public async logout(req: Request, res: Response) {
        if (req.session) {
            req.session.destroy(function () {
                return res.json({ status: "User successfully logged out" });
            });
        }
    }

    public async resetPassword(req: Request, res: Response) {

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query('SELECT * FROM users WHERE users.user_id = ?', [req.body.user_id], async function (err: any, userResult: any, fields: any) {
                        if (err) {
                            serverLog.error("In resetPassword ERROR CAME while login ", err.code, err.message);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        } else {
                            getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                                var presentDate = resObj["date"]
                                req.body.updated_date = presentDate
                                if (req.body.newPwd == req.body.confirmPwd) {
                                    var hash = await argon2.hash(req.body.newPwd, { timeCost: argon2Data["timeCost"], parallelism: argon2Data["parallelism"], memoryCost: argon2Data["memoryCost"] });
                                    req.body.newPwd = hash
                                    connection.query(`UPDATE users set users.password=?,users.updated_date =?  WHERE user_id = ?`, [req.body.newPwd, req.body.updated_date, req.body.user_id], async function (err: any, result: any, fields: any) {
                                        if (err) {
                                            res.json({ message: 'Error Occured', status: 500 });
                                        }
                                        else {
                                            connection.query(`COMMIT`, async function (err: any, result: any, fields: any) {
                                                if (err) {
                                                    res.json({ message: 'Problem while commit', status: 500 });
                                                }
                                                else {
                                                    await connection.query('UPDATE tokendb set tokendb.status=0 WHERE token = ?', [req.body.genToken]);
                                                    await connection.query('COMMIT');


                                                    var reqJsonObj: any = {}
                                                    reqJsonObj["user_id"] = userResult[0].user_id
                                                    reqJsonObj["task"] = "confirmPassword"
                                                    reqJsonObj["user_name"] = userResult[0].user_name
                                                    reqJsonObj["email_id"] = userResult[0].email_id

                                                    sendMailFunc(connection, reqJsonObj, function (resData: any) {
                                                        res.json({
                                                            message: 'password updated successfully',
                                                            statusCode: 200
                                                        });
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                                else {
                                    res.json({
                                        message: "New password does not match with confirm password",
                                        statusCode: 501
                                    });
                                }
                            })
                        }
                    })
                    connection.release();
                }
            });
        });
    }

    public async changePassword(req: Request, res: Response) {

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query('SELECT * FROM users WHERE users.user_id = ? AND users.status=1', [req.body.user_id], async function (err: any, userResult: any, fields: any) {
                        if (err) {
                            serverLog.error("In changePassword ERROR CAME while login ", err.code, err.message);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        }
                        else {
                            if (userResult.length == 0) {
                                res.json({
                                    message: 'Invalid User',
                                    statusCode: 501
                                });
                            }
                            else if (userResult.length >= 0) {
                                getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                                    var presentDate = resObj["date"]
                                    var oldDbPwd = userResult[0]['password']
                                    req.body.updated_date = presentDate
                                    if (req.body.newPwd == req.body.confirmPwd) {
                                        var hash = await argon2.hash(req.body.newPwd, { timeCost: argon2Data["timeCost"], parallelism: argon2Data["parallelism"], memoryCost: argon2Data["memoryCost"] });
                                        req.body.newPwd = hash
                                        if (await argon2.verify(oldDbPwd, req.body.oldPwd)) {
                                            connection.query(`UPDATE users set users.password=?,users.updated_date =?  WHERE user_id = ?`, [req.body.newPwd, req.body.updated_date, req.body.user_id], async function (err: any, result: any, fields: any) {
                                                if (err) {
                                                    res.json({ message: 'Error Occured', status: 500 });
                                                }
                                                else {
                                                    connection.query(`COMMIT`, async function (err: any, result: any, fields: any) {
                                                        if (err) {
                                                            res.json({ message: 'Prob while commit', status: 500 });
                                                        }
                                                        else {

                                                            var reqJsonObj: any = {}
                                                            reqJsonObj["user_id"] = userResult[0].user_id
                                                            reqJsonObj["task"] = "confirmPasswordUI"
                                                            reqJsonObj["user_name"] = userResult[0].user_name
                                                            reqJsonObj["email_id"] = userResult[0].email_id

                                                            sendMailFunc(connection, reqJsonObj, function (resData: any) {
                                                                res.json({
                                                                    message: 'password changed successfully',
                                                                    statusCode: 200
                                                                });
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                        else {
                                            res.json({
                                                message: 'Old password Entered is incorrect',
                                                statusCode: 501
                                            });
                                        }
                                    }
                                    else {
                                        res.json({
                                            message: "New password doen't match with confirm password",
                                            statusCode: 501
                                        });
                                    }
                                })
                            }
                        }
                    })
                    connection.release();
                }
            });
        });

    }

    public async checkToken(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    try {
                        var data = jwt.verify(req.body.token, mailData['secretKeyApp']);
                        jwt.verify(req.body.token, mailData['secretKeyApp'], function (err: any, decoded: any) {
                            if (err) {
                                serverLog.error("In checkToken err", err);
                                return res.json({ "message": "Token Expired", "statusCode": 515 });
                            } else {
                                connection.query('SELECT * FROM tokendb WHERE tokendb.token = ? AND tokendb.status=1', [req.body.token], async function (err: any, result: any, fields: any) {
                                    if (result.length == 0) {
                                        if (req.body.urlContent)
                                            return res.json({ "openedSecTime": true })
                                        else
                                            return res.json({ "status": "wrgToken" })
                                    }
                                    if (result[0]['status'] == 1) {
                                        return res.json({ "status": true })
                                    }
                                    else {
                                        return res.json({ "openedSecTime": true })
                                    }
                                })

                                connection.release();
                            }
                        });

                    }
                    catch (err) {
                        return res.json({ "status": false })
                    }
                }
            });
        });

    }

    public async sendMail(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    req.body.emailId = req.body.emailId + "@quadratyx.com"
                    connection.query('SELECT * FROM users WHERE users.email_id = ? AND users.status=1', [req.body.emailId], async function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("In sendMail ERROR CAME while login ", err.code, err.message);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        }
                        else {
                            if (result.length == 0) {
                                return res.json({
                                    message: 'User email is not registered.',
                                    statusCode: 501
                                });
                            }
                            else {
                                var reqJsonObj: any = {}
                                reqJsonObj["user_id"] = result[0].user_id
                                reqJsonObj["task"] = req.body.task
                                reqJsonObj["user_name"] = result[0].user_name
                                reqJsonObj["email_id"] = result[0].email_id

                                sendMailFunc(connection, reqJsonObj, function (resData: any) {
                                    return res.json(resData)
                                })
                            }
                        }
                    })
                    connection.release();
                }
            });
        });

    }

    public async getAllDurations(req: Request, res: Response) {
        serverLog.info("getAllDurations req", req.body)
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    const { id } = req.params;
                    var jsonObj = {
                        "todayDur": "",
                        "yesterdayDur": "",
                        "thisWeekHrs": "",
                        "lastWeekHrs": "",
                        "thisMonthHrs": "",
                        "lastMonthHrs": "",
                    }
                    connection.query('SELECT (sum(duration)/60) as total FROM time_sheet where entry_date=? and user_id = ?', [req.body.today, id], async function (err: any, result: any, fields: any) {
                        jsonObj['todayDur'] = result[0]['total'];
                        await connection.query('SELECT (sum(duration)/60) as total FROM time_sheet where entry_date=? and user_id = ?', [req.body.yesterday, id], function (err: any, result: any, fields: any) {
                            jsonObj['yesterdayDur'] = result[0]['total'];
                            connection.query('SELECT (sum(duration)/60) as total FROM time_sheet where  (entry_date BETWEEN ? AND ?)and user_id = ?', [req.body.lastweekSun, req.body.lastweekSat, id], async function (err: any, result: any, fields: any) {
                                jsonObj['lastWeekHrs'] = result[0]['total'];
                                await connection.query('SELECT (sum(duration)/60) as total FROM time_sheet where (entry_date BETWEEN ? and ?)and user_id = ?', [req.body.thisweekSun, req.body.today, id], function (err: any, result: any, fields: any) {
                                    jsonObj['thisWeekHrs'] = result[0]['total'];
                                    //keep here
                                    connection.query('SELECT ROUND(sum(duration)/60,0) as total FROM time_sheet where (entry_date BETWEEN ? and ?) and user_id = ?', [req.body.firstThisMonth, req.body.endThisMonth, id], async function (err: any, result: any, fields: any) {
                                        jsonObj['thisMonthHrs'] = result[0]['total'];
                                        connection.query('SELECT ROUND(sum(duration)/60,0) as total FROM time_sheet where (entry_date BETWEEN ? and ?) AND user_id = ?', [req.body.firstLastMonth, req.body.endLastMonth, id], function (err: any, result: any, fields: any) {
                                            jsonObj['lastMonthHrs'] = result[0]['total'];
                                            return res.json({ "data": jsonObj, statusCode: 200 })
                                        })
                                    })
                                })
                            })
                        })
                    })
                    connection.release();
                }
            });
        });


    }

    public async getDateList(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    var jsonObj = {
                        "todayDate": "",
                        "yesterdayDate": "",
                        "lastSatDate": "",
                        "lastSunDate": "",
                        "lastFriDate": "",
                    }
                    connection.query('SELECT WEEKDAY(CURDATE()) as total', async function (err: any, result: any, fields: any) {
                        var weekDay = result[0]['total']
                        var i
                        if (weekDay == 1)
                            i = parseInt(weekDay) - (dateLimit)
                        if (weekDay > 1)
                            i = (dateLimit) - parseInt(weekDay)
                        if (weekDay > 0) {
                            await connection.query('SELECT CURDATE() - INTERVAL ( WEEKDAY(CURDATE())+(?)) DAY as yesterday,CURDATE()  as today', [i], function (err: any, result: any, fields: any) {
                                jsonObj['todayDate'] = result[0]['today'];
                                jsonObj['yesterdayDate'] = result[0]['yesterday'];
                                return res.json({ "data": jsonObj, statusCode: 200 })
                            })
                        }
                        if (weekDay == 0) {
                            await connection.query(`SELECT CURDATE() - INTERVAL ( WEEKDAY(CURDATE())+0) DAY as yesterday,CURDATE()  as today,
                            CURDATE() - INTERVAL ( WEEKDAY(CURDATE())+1) DAY as lastSun,CURDATE() - INTERVAL ( WEEKDAY(CURDATE())+2) DAY as lastSat,
                            CURDATE() - INTERVAL ( WEEKDAY(CURDATE())+3) DAY as lastFri`,
                                function (err: any, result: any, fields: any) {
                                    jsonObj['todayDate'] = result[0]['today'];
                                    jsonObj['yesterdayDate'] = result[0]['yesterday'];
                                    jsonObj['lastSatDate'] = result[0]['lastSat'];
                                    jsonObj['lastSunDate'] = result[0]['lastSun'];
                                    jsonObj['lastFriDate'] = result[0]['lastFri'];
                                    return res.json({ "data": jsonObj, statusCode: 200 })
                                })
                        }
                    })
                    connection.release();
                }
            });
        });
    }

    public async getServerTime(req: Request, res: Response) {
        var date = new Date().toUTCString();
        var dateformated = date.substring(17, 25);
        var hms = dateformated;
        var a = hms.split(':');
        var seconds = (+a[0] + 5) * 60 * 60 + (+a[1] + 30) * 60;
        var d = seconds;
        var dur;
        const HOUR = 60 * 60;
        const MINUTE = 60;
        var minutesInSeconds = d % HOUR;
        var hours = Math.floor(d / HOUR);
        var minutes = Math.floor(minutesInSeconds / MINUTE)
        if (hours < 10) {
            var hr = "" + "0" + hours;
        }
        else {
            var hr = "" + hours;
        }
        if (minutes < 10) {
            var min = "" + "0" + minutes;
        }
        else {
            var min = "" + minutes;
        }
        dur = hr + ":" + min + ":00";
        var x = new Date();
        var y = x.getFullYear().toString();
        var m = (x.getMonth() + 1).toString();
        var dt = x.getDate().toString();
        (dt.length == 1) && (dt = '0' + dt);
        (m.length == 1) && (m = '0' + m);
        var yyyymmdd = y + '-' + m + '-' + dt;
        res.json({ timevalue: dur, datevalue: yyyymmdd, "statusCode": 200 });
    }

    public async checkDBConnection(req: Request, res: Response, next: any) {
        pool.getConnection(function (err: any, connection: any) {
            if (err) {
                serverLog.error("In checkDBConnection ",err)
                return res.json({ "message": "Database problem, Please contact admin.", "statusCode": 401 });
            }
            else {                
                connection.beginTransaction(function (err: any) {
                    if (err) {
                        serverLog.error('In checkDBConnection DB error connecting: ' + err.message);
                        return res.json({ "message": "Database problem, Please contact admin.", "statusCode": 401 });
                    } else {
                        serverLog.info('DB connected');
                        connection.release();
                        next()
                    }
                });
            }
        });
    }

    public async checkSession(req: Request, res: Response, next: any) {
        serverLog.info("req.headers is ", req.headers.authorization, typeof (req.headers.authorization));
        if (req.headers.authorization == 'null' || req.headers.authorization == undefined) {
            return res.json({ "message": "Please login", "statusCode": 515 });
        }
        else {
            try {
                jwt.verify(req.headers['authorization'], store['jwttoken']['secretKey'], function (err: any, decoded: any) {
                    if (err) {
                        serverLog.error("In checkSession err:", err);
                        if (err.name == "TokenExpiredError") {
                            return res.json({ "message": "Token expired, please login again.", "statusCode": 515 });
                        }
                        else {
                            return res.json({ "message": "Please login ", "statusCode": 515 });
                        }
                    } else {
                        if (req.session) {
                            serverLog.info("In checkSession session ", req.session, decoded.userid);
                            if (req.session.user == decoded.userid)
                                next();
                            else
                                return res.json({ "message": "Please login", "statusCode": 401 });
                        }
                    }
                });
            }
            catch (csErr) {
                return res.json({ "message": "Please login", "statusCode": 401 });

            }
        }
    }

    public async checkAuthentication(req: Request, res: Response, jsonObj: any, next: any) {
        serverLog.info("In checkAuthentication req.headers is ", req.headers.authorization, typeof (req.headers.authorization));
        if (req.headers.authorization == 'null' || req.headers.authorization == undefined) {
            return res.json({ "message": "Please login", "statusCode": 515 });
        }
        else {
            try {
                jwt.verify(req.headers['authorization'], store['jwttoken']['secretKey'], function (err: any, decoded: any) {
                    if (err) {
                        serverLog.error("In checkAuthentication err", err);
                        return res.json({ "message": "Please login", "statusCode": 515 });
                    } else {
                        if (req.session) {
                            if (req.session.user == decoded.userid && jsonObj['roles'].includes(decoded.role))
                                next();
                            else
                                return res.json({ "message": "Only authorized user can access this API.", "statusCode": 401 });
                        }
                    }
                });
            }
            catch (csErr) {
                return res.json({ "message": "Please login", "statusCode": 401 });

            }
        }
    }

    public async getAllProjForReportOrPlanning(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    var queryStr: any = `select * from user_roles
        where user_roles.user_id=?`
                    var options: any = []
                    options.push(req.body["user_id"])

                    connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("In getAllProjForReportOrPlanning, ERROR while quering in user_roles table", err.code, err.message);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        }
                        else {
                            var role_id = result[0]["role_id"]

                            if (req.body.start_date)
                                req.body.start_date = getDateStrFromDateObj(new Date(req.body.start_date))
                            if (req.body.end_date)
                                req.body.end_date = getDateStrFromDateObj(new Date(req.body.end_date))

                            var reqJsonObj: any = req.body

                            if (role_id == 1) {
                                getProjForAdmin(connection, reqJsonObj, function (resObj: any) {
                                    return res.json(resObj)
                                })
                            }
                            else if (role_id == 2) {
                                getProjForManager(connection, reqJsonObj, function (resObj: any) {
                                    return res.json(resObj)
                                })
                            }
                            else if (role_id == 3) {
                                getProjForUsers(connection, reqJsonObj, function (resObj: any) {
                                    return res.json(resObj)
                                })
                            }
                        }
                    })
                }
            })
        })
    }

}

const commonController = new CommonController();
export default commonController;