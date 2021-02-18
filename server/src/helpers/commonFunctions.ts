const { consoleLog, serverLog } = require('../logs/createLogger')
import store from "../serverConfig"
const argon2Data = store.argon2Params

const argon2 = require("argon2")
var dateLimit = store.dateRecord.lastDay

import nodemailer from 'nodemailer'
var mailData = store.mailData
import jwt from "jsonwebtoken"

export async function timeHMS(timeStr: any) {
    if (timeStr.split(":").length == 2) {
        timeStr += ":00"
    }
    return timeStr
}

export async function timeFormat(timeObj: any) {
    timeObj = new Date(timeObj).toLocaleTimeString('en-GB', { hour12: false }).split(" ")[0]
    return timeHMS(timeObj)
}

export async function getCurrentTimeStamp(connection: any, jsonObj: any, callback: any) {
    await connection.query(`SELECT CURRENT_TIMESTAMP`, async function (err: any, result: any, fields: any) {
        var resObj: any = {}
        resObj["date"] = result[0]["CURRENT_TIMESTAMP"]
        // console.log("resObj is ", resObj)
        callback(resObj)
    })

}

export async function sendMailFunc(connection: any, jsonObj: any, callback: any) {
    var user_id = jsonObj["user_id"]
    var task = jsonObj["task"]
    var user_name = jsonObj["user_name"]
    var email_id = jsonObj["email_id"]

    const transporter = nodemailer.createTransport({
        host: mailData.host,
        port: mailData.port,
        secure: mailData.secure,
        auth: {
            user: mailData.userEmail, // generated ethereal user
            pass: mailData.password // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    let token = jwt.sign({ userid: user_id }, mailData['secretKeyApp'], {
        expiresIn: mailData['mailExpiresIn']
    })
    var title = ""
    var bodyText = ""
    if (task == 'resetPassword') {
        title = mailData.reset.title
        bodyText = `Dear ` + user_name + `,
        
        You have requested to reset your password.  To do so, please click  on the following URL:
        http://` + mailData.clientURL + `/resetPassword/${token} .

        If you did not mean to reset your password, please contact the administrator immediately.
        The password reset link expires in 30 minutes.
        
        Thanks,
        Timesheet Support team`
    }
    else if (task == "confirmPasswordUI") {
        title = mailData.confirm.title
        bodyText = mailData.confirm.confirmBodyText
    }
    else {
        title = mailData.confirm.title
        bodyText = mailData.confirm.bodyText
    }

    let mailOptions = {
        from: mailData.fromOption, // sender address
        to: email_id, // list of receivers
        subject: title, // Subject line
        text: bodyText, // plain text body
    };

    await transporter.sendMail(mailOptions, async function (err, info) {
        if (err) {
            serverLog.error("In sendMail err is ", err)
            callback({
                message: 'err: ' + mailData.failure,
                statusCode: 500
            });
            return
        }
        else {
            //store token in db
            if (task == 'resetPassword') {
                connection.query('INSERT INTO tokendb set ?', [{ token: token, status: 1 }], function (err: any, result: any, fields: any) {
                    if (err) {
                        serverLog.error("In sendMail ERROR CAME while inserting tokendb ", err.code);
                        callback({
                            message: 'err: ' + err.message,
                            statusCode: 500
                        });
                        return
                    }
                    else {
                        connection.commit(function (err: any) {
                            if (err) {
                                serverLog.error('In sendMail Err while commiting tokendb : ', err.message);
                                connection.rollback(function () {
                                    throw err;
                                });
                            } else {
                                serverLog.info("token stored in db")
                            }
                        })
                    }
                })
            }

            callback({
                message: mailData.success,
                token: token,
                statusCode: 200
            });
        }
    });
}

export async function checkParams(req: any, res: any, params: any, next: any) {
    var bodyKeys = Object.keys(req.body)
    var flag = false
    var str = "Missed fields "
    params.filter((ele: any) => {
        if (!bodyKeys.includes(ele)) {
            str += ele + ", "
            flag = true
        }
    })
    if (str.includes(",")) {
        var strArr = str.split(",")
        strArr.pop()
        str = strArr.join(",")
    }
    if (flag) {
        return res.json({
            "message": str,
            "statusCode": 500
        })
    }
    else {
        if (req.body['start_date'] && req.body['end_date']) {
            if (new Date(req.body['start_date']) <= new Date(req.body['end_date'])) {
                next()
            }
            else {
                return res.json({
                    "message": "Please provide valid start_date and end_date",
                    "statusCode": 501
                })
            }
        }
    }
}

export async function arrayToJsonUsers(jsonObj: any, callback: any) {
    var projIds = [1, 2, 3, 4, 5, 6, 10, 100]
    var usersDetJson: any = {}
    jsonObj['data'].filter((obj: any) => {
        if (usersDetJson[obj['user_id']]) {
            usersDetJson[obj['user_id']]['catg'][obj['p_catg_id']] += obj['tot_dur']
            usersDetJson[obj['user_id']]['details']['count'] += obj['tot_dur']
        }
        else {
            if (obj['user_id']) {
                usersDetJson[obj['user_id']] = {}
                usersDetJson[obj['user_id']]['catg'] = {}

                projIds.filter((eachPId: any) => {
                    usersDetJson[obj['user_id']]['catg'][eachPId] = 0
                })


                usersDetJson[obj['user_id']]['catg'][obj['p_catg_id']] += obj['tot_dur']

                usersDetJson[obj['user_id']]['details'] = {}
                usersDetJson[obj['user_id']]['details']['user_name'] = obj['user_name']
                usersDetJson[obj['user_id']]['details']['count'] = obj['tot_dur']
            }
        }
    })
    callback(usersDetJson)
}

export async function getWeeksBtwDates(connection: any, jsonObj: any, callback: any) {
    // and is_workingday=1
    var queryStr: any = `SELECT cl_year,week_no  
    FROM qtx_calendar
    where cl_date between (?) and (?)
    group by cl_year,week_no;`
    var options: any = []
    options.push(jsonObj['start_date'])
    options.push(jsonObj['end_date'])
    serverLog.info("In getWeeksBtwDates ", queryStr, options)
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
        } else {
            var yearWeekJson: any = {}
            result.filter((eachBlk: any) => {
                if (yearWeekJson[eachBlk['cl_year']]) {
                    yearWeekJson[eachBlk['cl_year']].push(eachBlk['week_no'])
                }
                else {
                    yearWeekJson[eachBlk['cl_year']] = []
                    yearWeekJson[eachBlk['cl_year']].push(eachBlk['week_no'])
                }
            })
            var finalArr: any = [], tempJson: any = {}
            Object.keys(yearWeekJson).filter((eachYear: any) => {
                tempJson = {}
                tempJson['year'] = eachYear
                tempJson['weeks'] = yearWeekJson[eachYear]
                finalArr.push(tempJson)
            })
            callback(finalArr)
        }
    })
}

export async function getUserNames(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select usr.user_id,usr.user_name
                      from users as usr`
    var options: any = []
    if (jsonObj['user_id']) {
        queryStr += "\nwhere usr.user_id in (?)"
        options.push(jsonObj['user_id'])
    }
    queryStr += "\n\t order by usr.user_name"
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
            // return res.json({ "error": err, statusCode: 500 })
        } else {
            var finJson: any = {}
            result.filter((eachBlk: any) => {
                finJson[eachBlk['user_id']] = eachBlk['user_name']
            })
            callback(finJson)
        }
    })
}

export async function getProjectNames(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select pjts.id,pjts.project_name
                      from projects as pjts`
    var options: any = []
    if (jsonObj['project_id']) {
        queryStr += "\nwhere pjts.id in (?)"
        options.push(jsonObj['project_id'])
    }
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
            // return res.json({ "error": err, statusCode: 500 })
        } else {
            var finJson: any = {}
            result.filter((eachBlk: any) => {
                finJson[eachBlk['id']] = eachBlk['project_name']
            })
            callback(finJson)
        }
    })
}

export async function getNumberOfWorkingDays(connection: any, jsonObj: any, callback: any) {

    var yearWeekJson: any = jsonObj['yearWeekJson']
    var finRes: any = []
    yearWeekJson.filter((eachBlk: any, ind: any) => {
        var queryStr: any = `SELECT cl_year,week_no,sum(is_workingday) as count
    FROM qtx_calendar
    where cl_year in (?) and week_no in (?) and is_workingday=1
    group by cl_year,week_no;`
        var options: any = []
        options.push(eachBlk['year'])
        options.push(eachBlk['weeks'])
        serverLog.info("In getNumberOfWorkingDays ", queryStr, options)
        connection.query(queryStr, options, function (err: any, result: any, fields: any) {
            if (err) {
                serverLog.error("err is ", err)
                callback([])
            } else {
                finRes = finRes.concat(result)
                if (ind == (yearWeekJson.length - 1)) {
                    var yearWeekWorkCountJson: any = {}
                    var totCount: any = 0
                    finRes.filter((eachBlk: any) => {
                        if (yearWeekWorkCountJson[eachBlk['cl_year']]) {
                            yearWeekWorkCountJson[eachBlk['cl_year']][eachBlk['week_no']] = eachBlk['count']
                            totCount += eachBlk['count']
                        }
                        else {
                            yearWeekWorkCountJson[eachBlk['cl_year']] = {}
                            yearWeekWorkCountJson[eachBlk['cl_year']][eachBlk['week_no']] = eachBlk['count']
                            totCount += eachBlk['count']
                        }
                    })
                    callback({
                        "json": yearWeekWorkCountJson,
                        "tot_working_days": totCount
                    })
                }
            }
        })
    })
    if (yearWeekJson.length == 0) {
        callback({})
    }
}

export async function getLeavesDataForEachUsers(connection: any, jsonObj: any, callback: any) {
    var resultStore: any = []
    jsonObj['yearWeekJson'].filter((eachBlk: any, index: any) => {
        var queryStr: any = `SELECT usr.user_id,usr.user_name, year(leave_date) as year1, week(leave_date,3) as week1, sum(days)  as leaves
        FROM leave_data_daily as lv_data
        inner join users as usr on usr.user_id= lv_data.user_id
        where leave_type != "WFH" and year(leave_date)=? and week(leave_date,3) in (?) `
        var options: any = []
        options.push(eachBlk['year'])
        options.push(eachBlk['weeks'])

        if (jsonObj['user_id']) {
            queryStr += " and usr.user_id in (?) "
            options.push(jsonObj['user_id'])
        }
        queryStr += "\n\t group by usr.user_id, year(leave_date), week(leave_date);"


        serverLog.info("In getLeavesDataForEachUsers ", queryStr, options)

        connection.query(queryStr, options, function (err: any, result: any, fields: any) {
            if (err) {
                serverLog.info("err is ", err)
                callback([])
            } else {
                resultStore = resultStore.concat(result)
                if (index == (jsonObj['yearWeekJson'].length - 1)) {
                    var finUsrLvJson: any = {}
                    resultStore.filter((eachBlk: any) => {
                        if (finUsrLvJson[eachBlk['user_id']]) {
                            finUsrLvJson[eachBlk['user_id']]['tot_leaves'] += eachBlk['leaves']
                            if (finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']]) {
                                if (finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']][eachBlk['week1']]) {
                                    finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']][eachBlk['week1']] += eachBlk['leaves']
                                }
                                else {
                                    finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']][eachBlk['week1']] = eachBlk['leaves']
                                }
                            }
                            else {
                                finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']] = {}
                                finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']][eachBlk['week1']] = eachBlk['leaves']
                            }
                        }
                        else {
                            finUsrLvJson[eachBlk['user_id']] = {}
                            finUsrLvJson[eachBlk['user_id']]['tot_leaves'] = eachBlk['leaves']
                            finUsrLvJson[eachBlk['user_id']]['user_name'] = eachBlk['user_name']
                            finUsrLvJson[eachBlk['user_id']]['json'] = {}
                            finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']] = {}
                            finUsrLvJson[eachBlk['user_id']]['json'][eachBlk['year1']][eachBlk['week1']] = eachBlk['leaves']
                        }
                    })
                    callback(finUsrLvJson)
                }
            }
        })

    })
}

export function getYearWeekLeavesCount(connection: any, dateObj: any, callback: any) {
    var queryStr = `select cl_date from qtx_calendar
    where dayname not like "%Sat%"
    and dayname not like "%Sun%" and is_workingday=0`

    var options: any = []

    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.info("err is ", err)
            callback([])
        } else {
            var leaveDatesArr: any = []
            result.filter((eachBlck: any) => {
                leaveDatesArr.push(eachBlck["cl_date"])
            })
            callback(leaveDatesArr)
        }
    })
}

export function getCalcDateTime(connection: any, paramJsonObj: any, callback: any) {

    var offset = paramJsonObj["offset"]

    var presentDate = new Date();
    //60000,60
    var utc = presentDate.getTime() + (presentDate.getTimezoneOffset() * 60);

    //3600000,3600
    var newDate = new Date(utc + (3600 * offset));
    // console.log("newDate is ", newDate, getDateStrFromDateObj(newDate))
    callback({
        "date": getDateStrFromDateObj(newDate)
    })
}

export function getEditTSAccessRecords(connection: any, paramJsonObj: any, callback: any) {
    getCalcDateTime(connection, { offset: paramJsonObj["localeTimeOffset"] }, async function (resObj: any) {
        paramJsonObj["presentDate"] = resObj["date"]
        // console.log("In getEditTSAccessRecords paramJsonObj is ", paramJsonObj)
        var today: any = new Date(paramJsonObj["presentDate"].substring(0, 10))
        // var today: any = new Date()  //localServerDate
        var jsonObj: any = {}
        jsonObj["to"] = new Date(getDateStrFromDateObj(today))
        if (today.getDay() == 1) {//monday
            today.setDate(today.getDate() - 2 - dateLimit)
        }
        else {
            today.setDate(today.getDate() - dateLimit)
        }
        jsonObj["from"] = new Date(getDateStrFromDateObj(today))

        // console.log("afterchange today is ", today, jsonObj, jsonObj["from"] < jsonObj["to"])

        var reqJsonObj: any = {
            "start_date": jsonObj["from"],
            "end_date": jsonObj["to"]
        }
        getYearWeekLeavesCount(connection, reqJsonObj, function (leavesDataArr: any) {
            // callback(leavesDataArr)
            var holidaysCount: any = 0
            leavesDataArr.filter((eachLeave: any) => {
                if (eachLeave >= jsonObj["from"] && eachLeave <= jsonObj["to"]) {
                    holidaysCount += 1
                }
            })
            if (holidaysCount > 0) {
                jsonObj["from"].setDate(jsonObj["from"].getDate() - holidaysCount)
            }
            callback(jsonObj)
        })
    })
}

export function getDateStrFromDateObj(dateObj: any) {
    var resStr: any = ""
    resStr += dateObj.getFullYear() + "-"
    if ((dateObj.getMonth() + 1) > 9) {
        resStr += (dateObj.getMonth() + 1) + "-"
    }
    else {
        resStr += "0" + (dateObj.getMonth() + 1) + "-"
    }
    if ((dateObj.getDate()) > 9) {
        resStr += dateObj.getDate()
    }
    else {
        resStr += "0" + dateObj.getDate()
    }
    return resStr
}

export async function getYearWeeknoDays(connection: any, jsonObj: any, callback: any) {
    var queryStr = `select cl_date,cl_year,cl_month,week_no,dayname from qtx_calendar
    where dayname not like "%Sat%"
        and dayname not like "%Sun%"
    group by cl_year,week_no,cl_date`
    var options: any = []

    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.info("err is ", err)
            callback([])
        } else {
            // serverLog.info("In getYearWeeknoDays ", result)
            var finYearJson: any = {}
            result.filter((eachBlk: any) => {
                if (finYearJson[eachBlk['cl_year']]) {
                    if (finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]) {
                        finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['end_date'] = getDateStrFromDateObj(eachBlk['cl_date'])
                    }
                    else {
                        finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']] = {}
                        finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['month'] = eachBlk['cl_month']
                        finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['from_date'] = getDateStrFromDateObj(eachBlk['cl_date'])
                        finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['end_date'] = ""
                    }
                }
                else {
                    finYearJson[eachBlk['cl_year']] = {}
                    finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']] = {}
                    finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['month'] = eachBlk['cl_month']
                    finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['from_date'] = getDateStrFromDateObj(eachBlk['cl_date'])
                    finYearJson[eachBlk['cl_year']]["week_" + eachBlk['week_no']]['end_date'] = ""
                }
            })
            callback(finYearJson)
        }
    })

}

export async function getProjPweekJson(connection: any, jsonObj: any, callback: any) {
    var queryStr = `select project_id,year,week_no,p_week_no    
    FROM project_planning
    group by year,week_no,project_id,p_week_no`
    var options: any = []

    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.info("In getProjPweekJson err is ", err)
            callback([])
        } else {
            var projWeekJson: any = {}
            result.filter((eachBlk: any) => {
                if (projWeekJson["proj_" + eachBlk["project_id"]]) {
                    if (projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]]) {
                        if (projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]]["week_" + eachBlk["week_no"]]) {
                            serverLog.info("In getProjPweekJson week_year_match")
                        }
                        else {
                            projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]]["week_" + eachBlk["week_no"]] = "p_week_no_" + eachBlk["p_week_no"]
                            if (eachBlk["p_week_no"] > projWeekJson["proj_" + eachBlk["project_id"]]["max_p_week_no"])
                                projWeekJson["proj_" + eachBlk["project_id"]]["max_p_week_no"] = eachBlk["p_week_no"]
                        }
                    }
                    else {
                        projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]] = {}
                        projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]]["week_" + eachBlk["week_no"]] = "p_week_no_" + eachBlk["p_week_no"]
                        if (eachBlk["p_week_no"] > projWeekJson["proj_" + eachBlk["project_id"]]["max_p_week_no"])
                            projWeekJson["proj_" + eachBlk["project_id"]]["max_p_week_no"] = eachBlk["p_week_no"]
                    }
                }
                else {
                    projWeekJson["proj_" + eachBlk["project_id"]] = {}
                    projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]] = {}
                    projWeekJson["proj_" + eachBlk["project_id"]]["year_" + eachBlk["year"]]["week_" + eachBlk["week_no"]] = "p_week_no_" + eachBlk["p_week_no"]
                    projWeekJson["proj_" + eachBlk["project_id"]]["max_p_week_no"] = eachBlk["p_week_no"]
                }
            })
            callback(projWeekJson)
        }
    })
}

export async function getUsersLinkedToProj(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `SELECT * FROM user_projects
    where status=1 `
    var options: any = []

    if (jsonObj["project_id"]) {
        queryStr += "and project_id in (?) "
        options.push(jsonObj["project_id"])
    }

    serverLog.info("In getUsersLinkedToProj query  ", queryStr, options)
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("In getUsersLinkedToProj err is ", err)
            callback({})
        } else {
            var reqJson: any = {}
            // reqJson["count"]=0
            result.filter((eachBlk: any) => {
                if (reqJson[eachBlk["project_id"]]) {
                    reqJson[eachBlk["project_id"]].push(eachBlk["user_id"])
                }
                else {
                    reqJson[eachBlk["project_id"]] = []
                    reqJson[eachBlk["project_id"]].push(eachBlk["user_id"])
                }
            })
            callback(reqJson)
        }
    })
}

export async function getAssignHrsFromEachWeeks(connection: any, jsonObj: any, callback: any) {
    var yearWeekJson: any = jsonObj["yearWeekJson"]
    var finUsrRes: any = []
    yearWeekJson.filter((eachBlk: any, idx: any) => {
        var queryStr: any = `SELECT user_id,project_id,year,week_no,from_date,end_date,p_week_no,sum(assigned_hrs) as assignHrs
        FROM project_planning
        where year = (?) and week_no in (?)`
        var options: any = []
        options.push(eachBlk["year"])
        options.push(eachBlk["weeks"])

        if (jsonObj['user_id']) {
            queryStr += " and user_id in (?)"
            options.push(jsonObj['user_id'])
        }
        queryStr += "\n\t group by user_id,project_id,year,week_no;"
        serverLog.info("In getAssignHrsFromEachWeeks ", queryStr, options)
        connection.query(queryStr, options, function (err: any, result: any, fields: any) {
            if (err) {
                serverLog.error("In getAssignHrsFromEachWeeks err is ", err)
                callback({})
            } else {
                finUsrRes = finUsrRes.concat(result)
                if (idx == (yearWeekJson.length - 1)) {
                    var assUsrWeekJson: any = {}
                    finUsrRes.filter((eachArrBlck: any) => {
                        if (assUsrWeekJson[eachArrBlck['user_id']]) {//check user
                            if (assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]) {//check year
                                if (assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]) {//check week
                                    if (assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']]) {//check project
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']] += eachArrBlck['assignHrs']
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id'] + "_PWeekNo"] = eachArrBlck['p_week_no']
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['tot_assg_hrs'] += eachArrBlck['assignHrs']
                                    }
                                    else {
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']] = eachArrBlck['assignHrs']
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id'] + "_PWeekNo"] = eachArrBlck['p_week_no']
                                        assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['tot_assg_hrs'] += eachArrBlck['assignHrs']
                                    }
                                }
                                else {
                                    assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']] = {}
                                    assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['duration'] = getDateStrFromDateObj(eachArrBlck['from_date']) + " to " + getDateStrFromDateObj(eachArrBlck['end_date'])
                                    assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']] = eachArrBlck['assignHrs']
                                    assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id'] + "_PWeekNo"] = eachArrBlck['p_week_no']
                                    assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['tot_assg_hrs'] = eachArrBlck['assignHrs']
                                }
                            }
                            else {
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']] = {}
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']] = {}
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['duration'] = getDateStrFromDateObj(eachArrBlck['from_date']) + " to " + getDateStrFromDateObj(eachArrBlck['end_date'])
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']] = eachArrBlck['assignHrs']
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id'] + "_PWeekNo"] = eachArrBlck['p_week_no']
                                assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['tot_assg_hrs'] = eachArrBlck['assignHrs']
                            }
                        }
                        else {
                            assUsrWeekJson[eachArrBlck['user_id']] = {}
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']] = {}
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']] = {}
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['duration'] = getDateStrFromDateObj(eachArrBlck['from_date']) + " to " + getDateStrFromDateObj(eachArrBlck['end_date'])
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id']] = eachArrBlck['assignHrs']
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]["proj_" + eachArrBlck['project_id'] + "_PWeekNo"] = eachArrBlck['p_week_no']
                            assUsrWeekJson[eachArrBlck['user_id']]["year_" + eachArrBlck['year']]["week_" + eachArrBlck['week_no']]['tot_assg_hrs'] = eachArrBlck['assignHrs']
                        }
                    })

                    callback(assUsrWeekJson)
                    // callback(finUsrRes)
                }
            }
        })
    })
    if (yearWeekJson.length == 0) {
        callback({})
    }
}

export async function getActiveUser(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select usr.user_id,usr.user_name
    from users as usr
    where status=1`
    var options: any = []
    queryStr += "\n\t order by usr.user_name"
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
        } else {
            var finJson: any = {}
            result.filter((eachBlk: any) => {
                finJson[eachBlk['user_id']] = eachBlk['user_name']
            })
            callback(Object.keys(finJson))
        }
    })
}

export async function getAvailableHrForUsrWeek(connection: any, jsonObj: any, callback: any) {
    var monthArr: any = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    delete jsonObj["user_id"]
    delete jsonObj["project_id"]
    getActiveUser(connection, {}, function (activeUser: any) {
        jsonObj["user_id"] = activeUser
        getYearWeeknoDays(connection, jsonObj, function (yearWeeknoDaysJson: any) {
            // callback(yearWeeknoDaysJson)
            getUserNames(connection, jsonObj, function (userIDNameJson: any) {
                // callback(userIDNameJson)
                getWeeksBtwDates(connection, jsonObj, function (yearWeekJson: any) {
                    // callback(yearWeekJson)
                    jsonObj['yearWeekJson'] = yearWeekJson
                    getLeavesDataForEachUsers(connection, jsonObj, function (leavesDaysJson: any) {
                        // callback(leavesDaysJson)
                        var reqJsonObj: any = {
                            "user_id": jsonObj['user_id'],
                            "yearWeekJson": yearWeekJson
                        }
                        getNumberOfWorkingDays(connection, reqJsonObj, function (workingDaysJson: any) {
                            // callback(workingDaysJson)
                            getAssignHrsFromEachWeeks(connection, reqJsonObj, function (assignHrRes: any) {
                                // callback(assignHrRes)
                                var tableBodyRes: any = [], tempJson: any = {}, eachUsrJson: any = {}
                                var colHeaderData: any = {}, availableHrCount = 0
                                var topHeader: any = []
                                var monthStore: any = {}, month: any = 0

                                jsonObj["user_id"].filter((eachUserId: any, eachUsrIdx: any) => {
                                    eachUsrJson = {}
                                    eachUsrJson['Employee_name'] = userIDNameJson[eachUserId]
                                    eachUsrJson['Employee_id'] = eachUserId

                                    yearWeekJson.filter((eachBlk: any, ywidx: any) => {
                                        tempJson = {}
                                        eachBlk['weeks'].filter((eachWeekNum: any) => {
                                            tempJson = {}
                                            availableHrCount = 0
                                            if (eachUsrIdx == 0) {
                                                colHeaderData[eachBlk['year'] + "_" + eachWeekNum] = yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['from_date'] + " to " + yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['end_date']
                                                month = yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['month']
                                                if (monthStore[eachBlk['year']]) {
                                                    if (monthStore[eachBlk['year']][month]) {
                                                        monthStore[eachBlk['year']][month]['span'] += 1
                                                    }
                                                    else {
                                                        monthStore[eachBlk['year']][month] = {}
                                                        monthStore[eachBlk['year']][month]['span'] = 1
                                                        monthStore[eachBlk['year']][month]['header'] = monthArr[month - 1] + " " + eachBlk['year']
                                                    }
                                                }
                                                else {
                                                    monthStore[eachBlk['year']] = {}
                                                    monthStore[eachBlk['year']][month] = {}
                                                    monthStore[eachBlk['year']][month]['span'] = 1
                                                    monthStore[eachBlk['year']][month]['header'] = monthArr[month - 1] + " " + eachBlk['year']
                                                }
                                            }
                                            tempJson['y_week_no'] = eachWeekNum
                                            tempJson['year'] = eachBlk['year']
                                            tempJson["leavesCount"] = 0

                                            if (workingDaysJson['json'] && workingDaysJson['json'][eachBlk['year']] && workingDaysJson['json'][eachBlk['year']][eachWeekNum]) {
                                                availableHrCount = workingDaysJson['json'][eachBlk['year']][eachWeekNum] * 8
                                            }
                                            if (leavesDaysJson[eachUserId] && leavesDaysJson[eachUserId]['json'][eachBlk['year']] && leavesDaysJson[eachUserId]['json'][eachBlk['year']][eachWeekNum]) {
                                                availableHrCount -= (leavesDaysJson[eachUserId]['json'][eachBlk['year']][eachWeekNum] * 8)
                                                tempJson["leavesCount"] = (leavesDaysJson[eachUserId]['json'][eachBlk['year']][eachWeekNum] * 8)
                                            }
                                            if (assignHrRes[eachUserId] && assignHrRes[eachUserId]['year_' + eachBlk['year']] && assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]) {
                                                availableHrCount -= assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]["tot_assg_hrs"]
                                            }

                                            tempJson['available_hours'] = availableHrCount

                                            eachUsrJson["week_" + eachBlk['year'] + "_" + eachWeekNum] = tempJson
                                        })
                                        if (ywidx == (yearWeekJson.length - 1))
                                            tableBodyRes.push(eachUsrJson)
                                    })
                                })
                                serverLog.info("monthStore is ", monthStore)
                                Object.keys(monthStore).filter((yearKey: any) => {
                                    Object.keys(monthStore[yearKey]).filter((monthKey: any) => {
                                        topHeader.push({
                                            "year": yearKey,
                                            "month": monthKey,
                                            "header": monthStore[yearKey][monthKey]['header'],
                                            "span": monthStore[yearKey][monthKey]['span'],
                                        })
                                    })
                                })

                                callback({
                                    "status": 200,
                                    "start_date": jsonObj['start_date'],
                                    "end_date": jsonObj['end_date'],
                                    "columns": colHeaderData,
                                    "topHeader": topHeader,
                                    "tableData": tableBodyRes
                                })
                                connection.release();
                            })
                        })
                    })
                })
            })
        })
    })
}

export async function getAssignHrForUsrWeek(connection: any, jsonObj: any, callback: any) {
    var monthArr: any = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    var userFlag: boolean = false
    var userFilter: any = [], projFilter: any = []
    if (jsonObj["user_id"]) {
        userFlag = true
        userFilter = jsonObj["user_id"]
    }
    var checkRowFlag: boolean = false

    getUsersLinkedToProj(connection, jsonObj, function (userLinkedProjJson: any) {
        // callback(userLinkedProjJson)
        getYearWeeknoDays(connection, jsonObj, function (yearWeeknoDaysJson: any) {
            // callback(yearWeeknoDaysJson)
            getProjectNames(connection, jsonObj, function (projectIDNameJson: any) {
                // callback(projectIDNameJson)
                getUserNames(connection, jsonObj, function (userIDNameJson: any) {
                    // callback(userIDNameJson)
                    getWeeksBtwDates(connection, jsonObj, function (yearWeekJson: any) {
                        // callback(yearWeekJson)
                        jsonObj['yearWeekJson'] = yearWeekJson
                        getLeavesDataForEachUsers(connection, jsonObj, function (leavesDaysJson: any) {
                            // callback(leavesDaysJson)                        
                            var reqJsonObj: any = {
                                "user_id": jsonObj['user_id'],
                                "yearWeekJson": yearWeekJson
                            }
                            // jsonObj
                            getNumberOfWorkingDays(connection, reqJsonObj, function (workingDaysJson: any) {
                                // callback(workingDaysJson)
                                // console.log("workingDaysJson is ",workingDaysJson)
                                getAssignHrsFromEachWeeks(connection, reqJsonObj, function (assignHrRes: any) {
                                    // callback(assignHrRes)
                                    // console.log("assignHrRes is ",assignHrRes)
                                    var tableBodyRes: any = [], tempJson: any = {}, eachUsrJson: any = {}
                                    var colHeaderData: any = {}, availableHrCount = 0, assignedHrsCount = 0
                                    var topHeader: any = []
                                    var monthStore: any = {}, month: any = 0

                                    // jsonObj["project_id"]
                                    if (Object.keys(userLinkedProjJson).length > 0) {
                                        projFilter = Object.keys(userLinkedProjJson)
                                    }
                                    else {
                                        projFilter = jsonObj["project_id"]
                                    }
                                    projFilter.filter((eachProjId: any, eachProjIdx: any) => {
                                        if (!userFlag && userLinkedProjJson[eachProjId]) {
                                            userFilter = userLinkedProjJson[eachProjId]
                                        }
                                        // jsonObj['user_id']
                                        // userLinkedProjJson[eachProjId]
                                        userFilter.filter((eachUserId: any, eachUsrIdx: any) => {
                                            eachUsrJson = {}
                                            eachUsrJson['Employee_name'] = userIDNameJson[eachUserId]
                                            eachUsrJson['Employee_id'] = eachUserId
                                            eachUsrJson['Project_id'] = eachProjId
                                            eachUsrJson['Project_name'] = projectIDNameJson[eachProjId]

                                            checkRowFlag = false

                                            yearWeekJson.filter((eachBlk: any, ywidx: any) => {
                                                tempJson = {}
                                                eachBlk['weeks'].filter((eachWeekNum: any) => {
                                                    tempJson = {}
                                                    availableHrCount = 0
                                                    assignedHrsCount = 0
                                                    if (eachProjIdx == 0 && eachUsrIdx == 0) {
                                                        colHeaderData[eachBlk['year'] + "_" + eachWeekNum] = yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['from_date'] + " to " + yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['end_date']
                                                        month = yearWeeknoDaysJson[eachBlk['year']]['week_' + eachWeekNum]['month']
                                                        if (monthStore[eachBlk['year']]) {
                                                            if (monthStore[eachBlk['year']][month]) {
                                                                monthStore[eachBlk['year']][month]['span'] += 1
                                                            }
                                                            else {
                                                                monthStore[eachBlk['year']][month] = {}
                                                                monthStore[eachBlk['year']][month]['span'] = 1
                                                                monthStore[eachBlk['year']][month]['header'] = monthArr[month - 1] + " " + eachBlk['year']
                                                            }
                                                        }
                                                        else {
                                                            monthStore[eachBlk['year']] = {}
                                                            monthStore[eachBlk['year']][month] = {}
                                                            monthStore[eachBlk['year']][month]['span'] = 1
                                                            monthStore[eachBlk['year']][month]['header'] = monthArr[month - 1] + " " + eachBlk['year']
                                                        }
                                                    }
                                                    tempJson['y_week_no'] = eachWeekNum
                                                    tempJson['year'] = eachBlk['year']

                                                    if (workingDaysJson['json'] && workingDaysJson['json'][eachBlk['year']] && workingDaysJson['json'][eachBlk['year']][eachWeekNum]) {
                                                        availableHrCount = workingDaysJson['json'][eachBlk['year']][eachWeekNum] * 8
                                                    }
                                                    if (leavesDaysJson[eachUserId] && leavesDaysJson[eachUserId]['json'][eachBlk['year']] && leavesDaysJson[eachUserId]['json'][eachBlk['year']][eachWeekNum]) {
                                                        availableHrCount -= (leavesDaysJson[eachUserId]['json'][eachBlk['year']][eachWeekNum] * 8)
                                                    }
                                                    if (assignHrRes[eachUserId] && assignHrRes[eachUserId]['year_' + eachBlk['year']] && assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]) {
                                                        availableHrCount -= assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]["tot_assg_hrs"]
                                                    }

                                                    if (assignHrRes[eachUserId] && assignHrRes[eachUserId]['year_' + eachBlk['year']] && assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum] && assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]["proj_" + eachProjId]) {
                                                        assignedHrsCount = assignHrRes[eachUserId]['year_' + eachBlk['year']]['week_' + eachWeekNum]["proj_" + eachProjId]
                                                    }

                                                    tempJson['available_hours'] = availableHrCount
                                                    tempJson['assigned_hours'] = assignedHrsCount
                                                    if (assignedHrsCount > 0) {
                                                        checkRowFlag = true
                                                    }
                                                    eachUsrJson["week_" + eachBlk['year'] + "_" + eachWeekNum] = tempJson
                                                })
                                                if (ywidx == (yearWeekJson.length - 1) && (checkRowFlag || userFlag))
                                                    tableBodyRes.push(eachUsrJson)
                                            })
                                        })
                                    })
                                    serverLog.info("monthStore is ", monthStore)
                                    Object.keys(monthStore).filter((yearKey: any) => {
                                        Object.keys(monthStore[yearKey]).filter((monthKey: any) => {
                                            topHeader.push({
                                                "year": yearKey,
                                                "month": monthKey,
                                                "header": monthStore[yearKey][monthKey]['header'],
                                                "span": monthStore[yearKey][monthKey]['span'],
                                            })
                                        })
                                    })

                                    callback({
                                        "status": 200,
                                        "start_date": jsonObj['start_date'],
                                        "end_date": jsonObj['end_date'],
                                        "columns": colHeaderData,
                                        "topHeader": topHeader,
                                        "tableData": tableBodyRes
                                    })
                                    connection.release();
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}

export async function insertOrUpdateUserProject(connection: any, reqjsonObj: any, callback: any) {
    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
        var presentDate: any = resObj["date"]
        var userProjDetJson: any = reqjsonObj["userProjDetJson"]
        var userProjJson: any = reqjsonObj['userProjJson']
        var upOptions: any = [], upQuery: any = ''
        if (userProjDetJson[userProjJson["user_id"]] && userProjDetJson[userProjJson["user_id"]].includes(userProjJson["project_id"])) {
            upQuery = `UPDATE user_projects  set status=1,updated_date =? where user_id=? and project_id=?`
            upOptions.push(presentDate)
            upOptions.push(userProjJson["user_id"])
            upOptions.push(userProjJson["project_id"])
        }
        else {
            if (!userProjDetJson[userProjJson["user_id"]]) {
                userProjDetJson[userProjJson["user_id"]] = []
            }
            userProjDetJson[userProjJson["user_id"]].push(userProjJson["project_id"])
            upQuery = `INSERT into user_projects  set user_id=?,project_id =?,status=1,created_date =?,updated_date =?`
            upOptions.push(userProjJson["user_id"])
            upOptions.push(userProjJson["project_id"])
            upOptions.push(presentDate)
            upOptions.push(presentDate)
        }
        serverLog.info("In insertOrUpdateUserProject userId ", userProjJson["user_id"], " projectId ", userProjJson["project_id"], "\n\t ", upQuery, upOptions)
        connection.query(upQuery, upOptions, function (err: any, result: any, fields: any) {
            if (err) {
                serverLog.error("In insertOrUpdateUserProject err is ", err)
                callback({ "insertUpdateError": err, "userProjDetJson": userProjDetJson })
            } else {
                connection.query("COMMIT", function (err: any) {
                    if (err) {
                        serverLog.error("In insertOrUpdateUserProject ERR while commit ", err)
                        callback({ "commmitError": err, "userProjDetJson": userProjDetJson })
                    }
                    else {
                        callback({ "userProjDetJson": userProjDetJson })
                    }
                })
            }
        })
    })
}

export async function insertOrUpdateAssignHr(connection: any, reqjsonObj: any, callback: any) {
    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
        var presentDate: any = resObj["date"]
        var yearWeeknoDaysJson = reqjsonObj['yearWeeknoDaysJson']
        var assignHrRes = reqjsonObj['assignHrRes']
        var jsonObj = reqjsonObj['jsonObj']
        var projWeekNoJson = reqjsonObj['projWeekNoJson']
        var userProjDetJson = reqjsonObj['userProjDetJson']
        var newPPRow: any = {}, userProjFuncReqJson: any = {}

        var row = reqjsonObj["row"], column = reqjsonObj["column"]

        if (row >= jsonObj['tableInfo'].length) {
            callback({
                "status": 200,
                "message": "API works properly",
                // "projWeekNoJson": projWeekNoJson
            })
            return
        }
        var eachUserRow: any = jsonObj['tableInfo'][row]
        // serverLog.info("eachUserRow is ", eachUserRow,row,column)
        var userProjJson: any = {}
        newPPRow = {}
        var colIdx: any = column, eachColYear = eachUserRow['year'][column]
        newPPRow = {}
        newPPRow['project_id'] = jsonObj['project_id']
        newPPRow['user_id'] = eachUserRow['user_id']
        newPPRow['year'] = eachColYear
        newPPRow['week_no'] = eachUserRow['y_week_no'][colIdx]
        newPPRow['month'] = yearWeeknoDaysJson[eachColYear]["week_" + eachUserRow['y_week_no'][colIdx]]['month']
        // new Date
        newPPRow['from_date'] = (yearWeeknoDaysJson[eachColYear]["week_" + eachUserRow['y_week_no'][colIdx]]['from_date'])
        newPPRow['end_date'] = (yearWeeknoDaysJson[eachColYear]["week_" + eachUserRow['y_week_no'][colIdx]]['end_date'])
        newPPRow['available_hrs'] = eachUserRow['available_hours'][colIdx]
        newPPRow['assigned_hrs'] = eachUserRow['assigned_hours'][colIdx]
        newPPRow['created_date'] = presentDate
        newPPRow['updated_date'] = presentDate
        // serverLog.info(" newPPRow is ", newPPRow)

        //for userProjJson
        userProjJson["user_id"] = newPPRow['user_id']
        userProjJson["project_id"] = newPPRow['project_id']
        userProjJson["status"] = 1
        userProjJson["created_date"] = newPPRow['created_date']
        userProjJson["updated_date"] = newPPRow['updated_date']


        var queryStr: any = ``, options: any = [], statusStr = ""
        //p_week_no is missing
        if ((assignHrRes[eachUserRow['user_id']] && assignHrRes[eachUserRow['user_id']]["year_" + eachColYear] && assignHrRes[eachUserRow['user_id']]["year_" + eachColYear]["week_" + newPPRow['week_no']]) && (assignHrRes[eachUserRow['user_id']]["year_" + eachColYear]["week_" + newPPRow['week_no']]["proj_" + newPPRow['project_id']] || assignHrRes[eachUserRow['user_id']]["year_" + eachColYear]["week_" + newPPRow['week_no']]["proj_" + newPPRow['project_id']] == 0)) {
            statusStr = "update"
            newPPRow['p_week_no'] = projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']].split("p_week_no_")[1]
            serverLog.info("Update row=", row, " column=", column, "proj_wrrkNo ", newPPRow['p_week_no'])

            queryStr = `UPDATE project_planning set available_hrs=?,assigned_hrs=?,updated_date=? WHERE year=? and week_no=? and p_week_no=? and user_id=? and project_id=?`
            options = [
                newPPRow['available_hrs'],
                newPPRow['assigned_hrs'],
                newPPRow['updated_date'],
                newPPRow['year'],
                newPPRow['week_no'],
                newPPRow['p_week_no'],
                newPPRow['user_id'],
                newPPRow['project_id']
            ]
        }
        else {
            statusStr = "insert"
            if (!(newPPRow['assigned_hrs'] == 0)) {
                if (projWeekNoJson["proj_" + jsonObj["project_id"]]) {
                    if (projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]) {
                        if (projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']]) {
                            serverLog.info("In insertOrUpdateAssignHr Same week came for same project")
                        }
                        else {
                            projWeekNoJson["proj_" + jsonObj["project_id"]]["max_p_week_no"] += 1
                            projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']] = "p_week_no_" + projWeekNoJson["proj_" + jsonObj["project_id"]]["max_p_week_no"]
                        }
                    }
                    else {
                        projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear] = {}
                        projWeekNoJson["proj_" + jsonObj["project_id"]]["max_p_week_no"] += 1
                        projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']] = "p_week_no_" + projWeekNoJson["proj_" + jsonObj["project_id"]]["max_p_week_no"]
                    }
                }
                else {
                    projWeekNoJson["proj_" + jsonObj["project_id"]] = {}
                    projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear] = {}
                    projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']] = "p_week_no_1"
                    projWeekNoJson["proj_" + jsonObj["project_id"]]["max_p_week_no"] = 1
                }
                newPPRow['p_week_no'] = projWeekNoJson["proj_" + jsonObj["project_id"]]["year_" + eachColYear]["week_" + newPPRow['week_no']].split("p_week_no_")[1]
                serverLog.info("Insert row=", row, " column=", column, "pweekNo ", newPPRow['p_week_no'])
                queryStr = `INSERT INTO project_planning set `
                var options: any = []
                Object.keys(newPPRow).filter((eachKey: any) => {
                    queryStr += eachKey + "=?, "
                    options.push(newPPRow[eachKey])
                })
                queryStr = queryStr.split(",")
                queryStr.pop()
                queryStr = queryStr.join(",")
            }
        }

        if (!(newPPRow['assigned_hrs'] == 0 && statusStr == "insert")) {
            serverLog.info("queryStr is ", queryStr)
            connection.query(queryStr, options, function (err: any, result: any, fields: any) {
                if (err) {
                    serverLog.error("In insertOrUpdateAssignHr err is ", err)
                    callback([])
                } else {
                    connection.query("COMMIT", function (err: any) {
                        if (err) {
                            serverLog.error("In insertOrUpdateAssignHr ERR while commit ", err)
                        }
                        else {
                            userProjFuncReqJson['userProjJson'] = userProjJson
                            userProjFuncReqJson['userProjDetJson'] = userProjDetJson

                            insertOrUpdateUserProject(connection, userProjFuncReqJson, function (resData: any) {
                                userProjDetJson = resData["userProjDetJson"]
                                if ((column + 1) < eachUserRow['year'].length) {
                                    reqjsonObj["column"] += 1
                                }
                                else {
                                    reqjsonObj["row"] += 1
                                    reqjsonObj["column"] = 0
                                }
                                insertOrUpdateAssignHr(connection, reqjsonObj, function (resFromLoop: any) {
                                    callback(resFromLoop)
                                })
                            })
                        }
                    });
                }
            })
        }
        else {
            if ((column + 1) < eachUserRow['year'].length) {
                reqjsonObj["column"] += 1
            }
            else {
                reqjsonObj["row"] += 1
                reqjsonObj["column"] = 0
            }
            insertOrUpdateAssignHr(connection, reqjsonObj, function (resFromLoop: any) {
                callback(resFromLoop)
            })
        }
    })
}

export async function saveAssignHrForUsrWeek(connection: any, jsonObj: any, callback: any) {
    getAllUserProjDetails(connection, jsonObj, function (userProjDetJson: any) {
        // callback(userProjDetJson)
        getProjPweekJson(connection, jsonObj, function (projWeekNoJson: any) {
            // callback(projWeekNoJson)
            getYearWeeknoDays(connection, jsonObj, function (yearWeeknoDaysJson: any) {
                // callback(yearWeeknoDaysJson)
                getWeeksBtwDates(connection, jsonObj, function (yearWeekJson: any) {
                    // callback(yearWeekJson)
                    var reqJsonObj: any = {
                        // "user_id": jsonObj['user_id'],
                        "yearWeekJson": yearWeekJson
                    }
                    getAssignHrsFromEachWeeks(connection, reqJsonObj, function (assignHrRes: any) {
                        // callback(assignHrRes)
                        var reqJsonOBJData: any = {}
                        reqJsonOBJData['yearWeeknoDaysJson'] = yearWeeknoDaysJson
                        reqJsonOBJData['yearWeekJson'] = yearWeekJson
                        reqJsonOBJData['assignHrRes'] = assignHrRes
                        reqJsonOBJData['jsonObj'] = jsonObj
                        reqJsonOBJData['projWeekNoJson'] = projWeekNoJson
                        reqJsonOBJData['userProjDetJson'] = userProjDetJson

                        reqJsonOBJData["row"] = 0
                        reqJsonOBJData["column"] = 0

                        insertOrUpdateAssignHr(connection, reqJsonOBJData, function (resultObj: any) {
                            callback(resultObj)
                            connection.release();
                        })
                    })
                })
            })
        })
    })
}

export async function getAllUserProjDetails(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `SELECT project_id,user_id FROM user_projects    
    group by project_id,user_id;`
    var options: any = []
    connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("In getAllUserProjDetails err is ", err)
            callback([])
        } else {
            var reqUsrProjJson: any = {}
            result.filter((eachBlk: any) => {
                if (reqUsrProjJson[eachBlk["user_id"]]) {
                    reqUsrProjJson[eachBlk["user_id"]].push(eachBlk["project_id"])
                }
                else {
                    reqUsrProjJson[eachBlk["user_id"]] = []
                    reqUsrProjJson[eachBlk["user_id"]].push(eachBlk["project_id"])
                }
            })
            callback(reqUsrProjJson)
        }
    })
}

export async function mergeUserProjectTable(connection: any, jsonObj: any, callback: any) {
    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
        var presentDate: any = resObj["date"]
        getAllUserProjDetails(connection, jsonObj, function (userProjDetJson: any) {
            var queryStr: any = `SELECT project_id,user_id FROM project_planning    
        group by project_id,user_id;`
            var options: any = []
            // callback(userProjDetJson)
            connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
                if (err) {
                    serverLog.error("In mergeUserProjectTable err is ", err)
                    callback([])
                } else {
                    // callback(result)
                    var upQuery: any = ``, upOptions: any = []
                    result.filter(async (eachBlk: any, uind: any) => {
                        upOptions = []
                        if (userProjDetJson[eachBlk["user_id"]] && userProjDetJson[eachBlk["user_id"]].includes(eachBlk["project_id"])) {
                            upQuery = `UPDATE user_projects  set status=1,updated_date =? where user_id=? and project_id=?`
                            upOptions.push(presentDate)
                            upOptions.push(eachBlk["user_id"])
                            upOptions.push(eachBlk["project_id"])
                        }
                        else {
                            if (!userProjDetJson[eachBlk["user_id"]]) {
                                userProjDetJson[eachBlk["user_id"]] = []
                            }
                            userProjDetJson[eachBlk["user_id"]].push(eachBlk["project_id"])
                            upQuery = `INSERT into user_projects  set user_id=?,project_id =?,status=1,created_date =?,updated_date =?`
                            upOptions.push(eachBlk["user_id"])
                            upOptions.push(eachBlk["project_id"])
                            upOptions.push(presentDate)
                            upOptions.push(presentDate)
                        }
                        serverLog.info("For userID ", eachBlk["user_id"], " projectId ", eachBlk["project_id"], "\n ", upQuery, upOptions)

                        await connection.query(upQuery, upOptions);
                        await connection.query("COMMIT");

                        if (uind == (result.length - 1)) {
                            callback("Hello")
                        }
                    })
                }
            })
        })
    })
}

export async function changePassToArgon(connection: any, jsonObj: any, callback: any) {
    var queryStr = `
    select user_id,password from users
    where user_id not in ("QTX091")`
    var options: any = []
    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
        var presentDate: any = resObj["date"]
        connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
            if (err) {
                serverLog.error("In changePassToArgon err is ", err)
                callback([])
            } else {
                var hash: any = "";
                result.filter(async (eachBlk: any, index: any) => {
                    eachBlk["password"] = "qtx@123"
                    hash = await argon2.hash(eachBlk["password"], { timeCost: argon2Data["timeCost"], parallelism: argon2Data["parallelism"], memoryCost: argon2Data["memoryCost"] });
                    // await 
                    // await connection.query('UPDATE users set password=?,updated_date =?  WHERE user_id = ?', [hash, presentDate, eachBlk["user_id"]]);
                    // await connection.query("COMMIT");
                    // console.log("data is ", eachBlk, hash)
                    if (index == (result.length - 1)) {
                        callback({ "status": "changes done" })
                    }
                })
                if (result.length == 0) {
                    callback({ "status": "No data available" })
                }
            }
        })
    })
}

//to get projects depends on user roles
export async function getProjForAdmin(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select id,project_code,project_code_old,project_name
    from projects `
    var options: any = []

    if (jsonObj["action"] == "planning" || jsonObj["action"] == "timesheet") {
        queryStr += "\n\t where status=1"   //active projects
    }
    queryStr += "\n\t order by projects.project_name"
    connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("In getProjForAdmin, ERROR while quering in projects table", err.code, err.message);
            callback({
                message: 'err: ' + err.message,
                statusCode: 500
            });
        }
        else {
            callback({
                "data": result,
                "statusCode": 200
            })
        }
    })
}

export async function getProjForManager(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select id,project_code,project_code_old,project_name
    from projects
    where manager_id=? `
    var options: any = []
    options.push(jsonObj["user_id"])

    if (jsonObj["action"] == "planning" || jsonObj["action"] == "timesheet") {
        queryStr += " and status=1" //active projects
    }
    queryStr += "\n\t order by projects.project_name"
    connection.query(queryStr, options, async function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("In getProjForManager, ERROR while quering in projects table", err.code, err.message);
            callback({
                message: 'err: ' + err.message,
                statusCode: 500
            });
        }
        else {
            callback({
                "data": result,
                "statusCode": 200
            })
        }
    })
}

export async function getProjectsList(connection: any, projectJson: any, callback: any) {
    var finRes: any = []
    serverLog.info("getProjectsList", projectJson)
    var user_id = projectJson['user_id']
    var projectId = projectJson['projectId']
    if (projectId.length > 0) {
        connection.query(`SELECT projects.id,projects.project_code,projects.project_code_old,projects.project_name FROM projects 
        INNER JOIN user_projects  ON projects.id=user_projects.project_id
        where user_projects.user_id=? and projects.status=1 AND 
        user_projects.status=1 and projects.id in (?) group by projects.id
        order by projects.project_name`,
            [user_id, projectId], function (err: any, result: any, fields: any) {
                if (!err) {
                    finRes = finRes.concat(result)
                    callback(finRes)
                }
                if (err) {
                    serverLog.error("err in getProjectsList is ", err)
                    callback([]);
                }
            })
    }
    else if (projectId.length == 0) {
        callback([])
    }
}

export async function getProjectsListFromPlanning(connection: any, jsonObj: any, callback: any) {
    var projectIds: any = []
    var finResArr: any = []
    getWeeksBtwDates(connection, jsonObj, function (yearWeekJson: any) {
        serverLog.info("In getProjectsListFromPlanning yearWeekJson", yearWeekJson, yearWeekJson.length)
        yearWeekJson.filter((eachBlk: any, ind: any) => {
            var queryStr: any = `SELECT project_id FROM project_planning
            where user_id=? 
            and year = ? and week_no in (?) group by project_id`
            var options: any = []
            options.push(jsonObj['user_id'])
            options.push(eachBlk['year'])
            options.push(eachBlk['weeks'])
            serverLog.info("In getProjectsListFromPlanning ", queryStr, options)
            connection.query(queryStr, options, function (err: any, result: any, fields: any) {
                if (err) {
                    serverLog.error("err in getProjectsListFromPlanning is ", err)
                    callback([]);
                }
                else {
                    finResArr = finResArr.concat(result)
                    if (ind == (yearWeekJson.length - 1)) {
                        projectIds = []
                        finResArr.filter((eachPl: any, idpl: any) => {
                            if (!(projectIds.includes(eachPl['project_id'])))
                                projectIds.push(eachPl['project_id'])
                        })
                        callback(projectIds)
                    }
                }
            })
        })
    })
}

export async function getProjForUsers(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = ""
    var options: any = []
    if (jsonObj["action"] == "report") {
        queryStr = `select proj.id,proj.project_code,proj.project_code_old,proj.project_name
        from projects as proj
        INNER join user_projects as usr_proj on usr_proj.project_id=proj.id
        where usr_proj.user_id=? `
        queryStr += "\n\t order by proj.project_name"
        options.push(jsonObj["user_id"])

        connection.query(queryStr, options, function (err: any, result: any, fields: any) {
            if (!err) {
                callback({
                    data: result,
                    statusCode: 200
                });
            }
            if (err) {
                serverLog.error("In getProjForUsers err:", (err))
                callback({
                    message: 'err: ' + err.message,
                    statusCode: 500
                });
            }
        })
    }
    else {
        var finRes: any = []
        getProjectsListFromPlanning(connection, jsonObj, function (projectId: any) {
            var projectIdJson: any = {}
            projectIdJson['projectId'] = projectId
            projectIdJson['user_id'] = jsonObj["user_id"]
            getProjectsList(connection, projectIdJson, function (projectRes: any) {
                finRes = finRes.concat(projectRes)
                callback({
                    data: finRes,
                    statusCode: 200
                });
            })
        })
    }
}