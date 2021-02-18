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
    // console.log("getDateStrFromDateObj",resStr)
    return resStr
}

export function changeDateToLocale(jsonObj: any) {
    // console.log("jsonObj is ", jsonObj)
    var tempArr: any = []
    jsonObj["res"].filter((eachBlk: any, index: any) => {
        eachBlk["entry_date"] = eachBlk["entry_date"].substring(0, 10)
        // console.log("eachBlk is ", eachBlk["entry_date"])
        eachBlk["entry_date"] = new Date(eachBlk["entry_date"] + " 00:00:00")
        tempArr.push(eachBlk)
    })
    // console.log("tempArr is ", tempArr)
    return tempArr
}

export function getLocaleTimeFromDate(dateObj: any) {
    if (typeof (dateObj) == 'string') {
        dateObj = new Date('' + dateObj)
    }
    return dateObj.toLocaleTimeString('en-GB').substring(0, 5)
}

export function getWrokedHrsFromSeconds(secs: any) {
    return parseFloat((secs/60/60).toFixed(2))
    var mins: any = secs / 60;
    var reqStr: any = ''
    if ((mins - mins % 60) / 60 < 10) {
        reqStr += '0'
    }
    reqStr += (mins - mins % 60) / 60 + ":"
    if (mins % 60 < 10) {
        reqStr += "0"
    }
    reqStr += (mins % 60)
    return reqStr
}