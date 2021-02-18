import { getNumberOfWorkingDays, getLeavesDataForEachUsers, getUserNames } from "../helpers/commonFunctions"
const { consoleLog, serverLog } = require('../logs/createLogger')

export async function getUsrProjCatList(connection: any, jsonObj: any, callback: any) {
    //Query using vw_user_daily_hours table
    var query2: any = ``
    var summFlag: any = false
    if (jsonObj['summRep']) {
        query2 = `Select p_catg_id,round(sum(hours),2) as tot_dur from vw_user_daily_hours as vw_usr
        inner join users as usr on usr.user_id=vw_usr.user_id `
        summFlag = true
    }
    else {
        query2 = `Select vw_usr.user_id,usr.user_name,p_catg_id,round(sum(hours),2) as tot_dur from vw_user_daily_hours as vw_usr
        inner join users as usr on usr.user_id=vw_usr.user_id `
    }
    var options: any = []
    if (Object.keys(jsonObj).length != 0) {
        query2 += "where "
        if (jsonObj['year']) {
            query2 += "year1 = ?" + " and "
            options.push(jsonObj['year'])
        }
        if (jsonObj['week']) {
            query2 += "week1 in (?)" + " and "
            options.push(jsonObj['week'])
        }
        if (jsonObj['month']) {
            query2 += "month1 in (?)" + " and "
            options.push(jsonObj['month'])
        }
        if (jsonObj['user_id']) {
            query2 += "vw_usr.user_id in (?)" + " and "
            options.push(jsonObj['user_id'])
        }
    }

    query2 = query2.split("and ")
    query2.pop()
    query2 = query2.join(" and ")
    if (summFlag) {
        query2 += " group by p_catg_id"
    }
    else {
        query2 += " group by vw_usr.user_id,p_catg_id"
    }

    serverLog.info("In getUsrProjCatList ", query2, options)
    connection.query(query2, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
            // return res.json({ "error": err, statusCode: 500 })
        } else {
            callback(result)
        }
    })
}

export async function getTotBillHrsList(connection: any, jsonObj: any, callback: any) {
    // callback("hello")
    if (!jsonObj['user_id']) {
        callback([])
        return
    }
    var tempJson: any = {}
    var finalResArr: any = []
    getUserNames(connection, jsonObj, function (usrNameJson: any) {
        getNumberOfWorkingDays(connection, jsonObj, function (workingDaysCount: any) {
            getLeavesDataForEachUsers(connection, jsonObj, function (usrLeavesJson: any) {
                var tot_leave_count: any = 0
                if (jsonObj['user_id']) {
                    workingDaysCount = workingDaysCount['tot_working_days']
                    jsonObj['user_id'].filter((eachUsrId: any, idx: any) => {
                        tempJson = {}
                        if (!jsonObj['summRep']) {
                            tempJson['user_id'] = eachUsrId
                            tempJson['user_name'] = usrNameJson[eachUsrId]
                            tempJson['tot_dur'] = (workingDaysCount) * 8
                            if (usrLeavesJson[eachUsrId]) {
                                tempJson['tot_dur'] -= (usrLeavesJson[eachUsrId]['tot_leaves'] * 8)
                            }
                            tempJson['p_catg_id'] = 100
                            finalResArr.push(tempJson)
                        }
                        else {
                            if (usrLeavesJson[eachUsrId]) {
                                tot_leave_count += (usrLeavesJson[eachUsrId]['tot_leaves'])
                            }
                            if (idx == (jsonObj['user_id'].length - 1)) {
                                tempJson['tot_dur'] = (workingDaysCount * jsonObj['user_id'].length - (tot_leave_count)) * 8
                                tempJson['p_catg_id'] = 100
                                finalResArr.push(tempJson)
                            }
                        }
                    })
                    callback(finalResArr)
                }
                else {
                    callback([])
                }
            })
        })
    })
}

export async function getUnAccountedHrs(connection: any, jsonObj: any, callback: any) {
    if (!jsonObj['user_id']) {
        callback([])
        return
    }
    var queryStr: any = ``
    var userFlag: any = false
    var options: any = []

    if (!jsonObj['summRep']) {
        //single or multiple users
        queryStr = `SELECT usr.user_id,usr.user_name,sum(unaccounted_hrs) as tot_dur
        FROM vw_wkly_unaccount_hours as una
        inner join users as usr on usr.user_id=una.user_id
        where usr.emp_group in ('MTT','MBT') `
        userFlag = true
    }
    else {
        queryStr = `SELECT sum(unaccounted_hrs) as tot_dur
        FROM vw_wkly_unaccount_hours as una
        inner join users as usr on usr.user_id=una.user_id
        where usr.emp_group in ('MTT','MBT') `
    }

    if (jsonObj['year']) {
        queryStr += " and cl_year=?"
        options.push(jsonObj['year'])
    }
    if (jsonObj['week']) {
        queryStr += " and week_no in (?)"
        options.push(jsonObj['week'])
    }
    if (jsonObj['user_id']) {
        queryStr += " and una.user_id in (?)"
        options.push(jsonObj['user_id'])
    }

    if (userFlag) {
        queryStr += "\n\tgroup by una.user_id"
    }
    serverLog.info("In getUnAccountedHrs query is ", queryStr, options)
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
            // return res.json({ "error": err, statusCode: 500 })
        } else {
            //add p_catg_id for all jsons
            var finalArr: any = []
            result.filter((eachJson: any) => {
                eachJson['p_catg_id'] = 10
                finalArr.push(eachJson)
            })
            result = finalArr
            callback(result)
        }
    })


}

export async function getActualPlannedHrs(connection: any, jsonObj: any, callback: any) {
    var options: any = []

    var actualQuery: any = `select usr.user_id,usr.user_name,sum(vw_usr.hours) as actual
    from vw_user_daily_hours as vw_usr
    inner join users as usr on usr.user_id = vw_usr.user_id`

    var plannedQuery: any = `select usr.user_id,usr.user_name,sum(pp.assigned_hrs) as planned
    FROM project_planning pp
    inner join users as usr on usr.user_id = pp.user_id`

    if (Object.keys(jsonObj).length > 0) {
        actualQuery += '\n where '
        plannedQuery += '\n where '
        if (jsonObj['year']) {
            actualQuery += " vw_usr.year1 = ? and "
            plannedQuery += " pp.year = ? and "
            options.push(jsonObj['year'])
        }
        if (jsonObj['week']) {
            actualQuery += " vw_usr.week1 in (?) and "
            plannedQuery += " pp.week_no in (?) and "
            options.push(jsonObj['week'])
        }
        if (jsonObj['month']) {
            actualQuery += " vw_usr.month1 in (?) and "
            plannedQuery += " pp.month in (?) and "
            options.push(jsonObj['month'])
        }
        if (jsonObj['user_id']) {
            actualQuery += " vw_usr.user_id in (?) and "
            plannedQuery += " pp.user_id in (?) and "
            options.push(jsonObj['user_id'])
        }
        if (jsonObj['project_id']) {
            actualQuery += " vw_usr.project_id in (?) and "
            plannedQuery += " pp.project_id in (?) and "
            options.push(jsonObj['project_id'])
        }

        actualQuery = actualQuery.split("and ")
        actualQuery.pop()
        actualQuery = actualQuery.join(" and ")

        plannedQuery = plannedQuery.split("and ")
        plannedQuery.pop()
        plannedQuery = plannedQuery.join(" and ")
    }

    actualQuery += '\n group by usr.user_id'
    plannedQuery += '\n group by usr.user_id'
    serverLog.info("actualQuery is ", actualQuery)
    serverLog.info("plannedQuery is ", plannedQuery)

    connection.query(actualQuery, options, function (err: any, actualResult: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
            // return res.json({ "error": err, statusCode: 500 })
        } else {
            connection.query(plannedQuery, options, function (err: any, plannedResult: any, fields: any) {
                if (err) {
                    serverLog.error("err is ", err)
                    callback([])
                    // return res.json({ "error": err, statusCode: 500 })
                } else {
                    var result: any = actualResult.concat(plannedResult)
                    callback(result)
                }
            })
        }
    })
}

export async function userReportFormat(result: any, callback: any) {
    var usrTabJson: any = {}
    result.filter((eachBlk: any) => {
        if (usrTabJson[eachBlk['user_id']]) {
            if (eachBlk['actual']) {
                usrTabJson[eachBlk['user_id']]['actual'] += eachBlk['actual']
            }
            if (eachBlk['planned']) {
                usrTabJson[eachBlk['user_id']]['planned'] += eachBlk['planned']
            }
        }
        else {
            if (eachBlk['user_id']) {
                usrTabJson[eachBlk['user_id']] = {}
                usrTabJson[eachBlk['user_id']]['user_name'] = eachBlk['user_name']
                usrTabJson[eachBlk['user_id']]['actual'] = 0
                usrTabJson[eachBlk['user_id']]['planned'] = 0
                if (eachBlk['actual']) {
                    usrTabJson[eachBlk['user_id']]['actual'] = eachBlk['actual']
                }
                if (eachBlk['planned']) {
                    usrTabJson[eachBlk['user_id']]['planned'] = eachBlk['planned']
                }
            }
        }
    })
    var finalArr: any = []
    var tempJson: any = {}
    var totActualScore: any = 0, totPlannedScore: any = 0
    Object.keys(usrTabJson).filter((eachUsrId: any) => {
        tempJson = {}
        tempJson['user_id'] = eachUsrId
        tempJson['user_name'] = usrTabJson[eachUsrId]['user_name']
        tempJson['actual'] = usrTabJson[eachUsrId]['actual'].toFixed(2)
        tempJson['planned'] = usrTabJson[eachUsrId]['planned'].toFixed(2)
        tempJson['variance'] = (usrTabJson[eachUsrId]['planned'] - usrTabJson[eachUsrId]['actual']).toFixed(2)
        totActualScore += usrTabJson[eachUsrId]['actual']
        totPlannedScore += usrTabJson[eachUsrId]['planned']
        finalArr.push(tempJson)
    })
    callback({
        "table": finalArr,
        "chart": [
            {
                "type": "actual",
                "hours": totActualScore.toFixed(2),
            },
            {
                "type": "planned",
                "hours": totPlannedScore.toFixed(2),
            }
        ]
    })
}

export async function adminReportFormat(result: any, callback: any) {
    var finRes: any = result['finRes']
    var catgDetJson: any = result['catgDetJson']
    var catgValue: any = {
        "total": 0
    }
    var projIds = [1, 2, 3, 4, 5, 6, 10, 100]
    projIds.filter((eachPId: any) => {
        catgValue[eachPId] = 0
    })

    finRes.filter((eachBlck: any) => {
        catgValue[eachBlck['p_catg_id']] = eachBlck['tot_dur']
        catgValue['total'] += eachBlck['tot_dur']
    })
    var finalArr: any = []
    var tempJson: any = {}
    Object.keys(catgDetJson).filter((pcatgId: any) => {
        tempJson = {}
        tempJson['type'] = catgDetJson[pcatgId]
        if (catgValue[pcatgId]) {
            tempJson['hours'] = parseFloat(catgValue[pcatgId].toFixed(2))
            tempJson['percent'] = 0
            if (catgValue["100"] != 0) {
                tempJson['percent'] = parseFloat(((catgValue[pcatgId] * 100) / catgValue["100"]).toFixed(2))
            }
        }
        else {
            tempJson['hours'] = 0
            tempJson['percent'] = 0
        }
        finalArr.push(tempJson)
    })
    callback(finalArr)
}
// import JSON
async function changeReportOrder(arrayObj: any, reqOrder: any, callback: any) {
    var tempArr: any = []
    arrayObj.filter((eachBlk: any) => {
        tempArr.push(JSON.parse(JSON.stringify(eachBlk, reqOrder, 4)))
    })
    callback(tempArr)
}

export async function getAdDetReportFormat(jsonObj: any, callback: any) {
    var finalArr: any = []
    var tempJson: any = {}

    var columnsJsonDet: any = jsonObj['columnsJsonDet']
    var usersDetJson: any = jsonObj['usersDetJson']
    var userResult: any = jsonObj['userResult']
    var workingDaysJson: any = jsonObj['workingDaysJson']
    var leavesDaysJson: any = jsonObj['leavesDaysJson']

    jsonObj['user_id'].filter(async (eachUserId: any) => {
        tempJson = {}
        tempJson['workingDaysHours'] = workingDaysJson['tot_working_days'] * 8
        tempJson['leavesDaysHours'] = 0
        if (leavesDaysJson[eachUserId]) {
            tempJson['leavesDaysHours'] = leavesDaysJson[eachUserId]['tot_leaves'] * 8
        }
        if (usersDetJson[eachUserId]) {
            Object.keys(columnsJsonDet).filter((eachKey: any) => {
                tempJson['user_name'] = usersDetJson[eachUserId]['details']['user_name']
                if (usersDetJson[eachUserId]['catg'][eachKey])
                    tempJson[columnsJsonDet[eachKey]] = parseFloat(usersDetJson[eachUserId]['catg'][eachKey].toFixed(2))
                else {
                    tempJson[columnsJsonDet[eachKey]] = 0
                }
                tempJson['billable_utilization'] = 0
                if (tempJson[columnsJsonDet['100']] != 0)
                    tempJson['billable_utilization'] = parseFloat(((tempJson[columnsJsonDet['1']] / tempJson[columnsJsonDet['100']]) * 100).toFixed(2))
            })
            finalArr.push(tempJson)
        }
        else {
            Object.keys(columnsJsonDet).filter((eachKey: any) => {
                tempJson['user_name'] = userResult[eachUserId]
                tempJson[columnsJsonDet[eachKey]] = 0
                tempJson['billable_utilization'] = 0
            })
            finalArr.push(tempJson)
        }
    })
    // callback(finalArr)
    var reqOrder: any = ["user_name", "workingDaysHours", "leavesDaysHours", "net_available_hrs", "billable_hrs", "pre_sales", "qta_dev", "internal_engg", "competency", "non_billable_hrs", "billable_utilization", "unaccounted_hrs"]
    changeReportOrder(finalArr, reqOrder, function (reqArr: any) {
        callback(reqArr)
    })
}

export async function getUsrTSReportFormat(jsonObj: any, callback: any) {
    var finalArr: any = []
    var finUserDet: any = {}
    var temp: any = {}
    var usersDetJson: any = jsonObj['usersDetJson']
    var detailsJson: any = jsonObj['detailsJson']
    if (!usersDetJson[jsonObj['user_id']]) {
        finUserDet = { "asdsadsad": "asdasd" }
        finalArr = []
        Object.keys(detailsJson).filter((pcId: any) => {
            temp = {}
            temp['type'] = detailsJson[pcId]
            temp['hours'] = 0
            temp['percent'] = 0
            finalArr.push(temp)
        })
        finUserDet = finalArr
    }
    else {
        Object.keys(usersDetJson).filter((userId: any) => {
            finalArr = []
            var pcIdList: any = Object.keys(usersDetJson[userId]['catg'])
            // usersDetJson[userId]['details']['count'] = usersDetJson[userId]['details']['count'] - usersDetJson[userId]['catg']['100']
            usersDetJson[userId]['details']['count'] = usersDetJson[userId]['catg']['100']
            Object.keys(detailsJson).filter((pcId: any) => {
                temp = {}
                if (pcIdList.includes(pcId)) {
                    temp['type'] = detailsJson[pcId]
                    temp['hours'] = usersDetJson[userId]['catg'][pcId].toFixed(2)
                    temp['percent'] = 0
                    if (usersDetJson[userId]['details']['count'] != 0)
                        temp['percent'] = ((temp['hours'] * 100) / (usersDetJson[userId]['details']['count'])).toFixed(2)
                    finalArr.push(temp)
                }
                else {
                    temp['type'] = detailsJson[pcId]
                    temp['hours'] = 0
                    temp['percent'] = 0
                    finalArr.push(temp)
                }
            })
            finUserDet = finalArr
        })
    }

    callback(finUserDet)

}

export async function getUsrLinkedToProj(connection: any, jsonObj: any, callback: any) {
    var queryStr: any = `select user_id
                    from user_projects 
                    where status = 1 `
    var options: any = []
    if (jsonObj['project_id']) {
        queryStr += "and project_id in (?) "
        options.push(jsonObj['project_id'])
    }
    serverLog.info("In getUsrLinkedToProj ", queryStr, options)
    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
        if (err) {
            serverLog.error("err is ", err)
            callback([])
        } else {
            var finalArr: any = []
            result.filter((eachBlk: any) => {
                finalArr.push(eachBlk['user_id'])
            })
            finalArr = Array.from(new Set(finalArr))
            callback(finalArr)
        }
    })
}