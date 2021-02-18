import { Request, Response } from 'express';
import pool from '../database';
const argon2 = require("argon2")
import store from "../serverConfig"
const { consoleLog, serverLog } = require('../logs/createLogger')
import { getDateStrFromDateObj, getCurrentTimeStamp } from '../helpers/commonFunctions'

const argon2Data = store.argon2Params

class AdminController {

    public async getAllProjCatg(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query(`SELECT * FROM project_category`, function (err: any, result: any, fields: any) {
                        if (!err)
                            return res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }

    public async getAllCustomerNames(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query(`SELECT customers.id,customers.customer_code,customers.name,customers.BU_code FROM customers
         where status=1`, function (err: any, result: any, fields: any) {
                        if (!err)
                            res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }

    public async getServiceLines(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('SELECT * FROM business_unit', function (err: any, result: any, fields: any) {
                        res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }
    public async getProTypes(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('SELECT * FROM project_type', function (err: any, result: any, fields: any) {
                        res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }

    public async getProjManagers(req: Request, res: Response) {
        //plz remember we need to send status=2 -->manager for working condition i hv written 1
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('SELECT users.user_id,users.user_name FROM users,user_roles WHERE status=1 AND users.user_id=user_roles.user_id AND (user_roles.role_id =1 or user_roles.role_id =2)', function (err: any, result: any, fields: any) {
                        if (!err)
                            res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }

    public async userlist(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    connection.query(`SELECT usr.user_id,usr.network_id,usr.user_name,usr.email_id,usr.emp_group,usr_r.role_id
                    FROM users as usr
                    INNER JOIN user_roles as usr_r on usr_r.user_id=usr.user_id
                    WHERE usr.status=1
                    order by usr.user_name`, function (err: any, result: any, fields: any) {
                        if (!err)
                            res.json({ data: result, statusCode: 200 })
                        if (err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                    })

                    connection.release();
                }
            });
        });

    }

    public async getOneUser(req: Request, res: Response): Promise<any> {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    const { id } = req.params;
                    connection.query(`SELECT usr.user_id,usr.network_id,usr.user_name,usr.email_id,usr.emp_group,usr_r.role_id,usr.is_billable
                    FROM users as usr
                    INNER JOIN user_roles as usr_r on usr_r.user_id=usr.user_id
                    WHERE usr.status=1 and usr.user_id = ?`, [id], function (err: any, result: any, fields: any) {
                        if (!err) {
                            if (result.length > 0) {
                                res.json({ data: result[0], statusCode: 200 })
                            }
                            else {
                                return res.json({
                                    message: 'Wrg User Id',
                                    statusCode: 500
                                });
                                // res.status(404).json({ text: "The User does not exist!" });
                            }
                        }
                        if (err) {
                            serverLog.error("In getOneUser err: ", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });

    }

    public async createUser(req: Request, res: Response): Promise<void> {
        req.body.password = store.specificFieldsInfo.basePassword
        req.body.email_id = req.body.email_id + "@quadratyx.com"
        req.body.status = 1

        var roleId = req.body.role_id
        delete req.body.role_id

        var hash = await argon2.hash(req.body.password, { timeCost: argon2Data["timeCost"], parallelism: argon2Data["parallelism"], memoryCost: argon2Data["memoryCost"] });
        req.body.password = hash

        serverLog.info("createUser request", req.body);

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        var presentDate = resObj["date"]
                        req.body.created_date = presentDate
                        req.body.updated_date = presentDate
                        connection.query('Select * from users where users.user_id=? or users.email_id=? or users.network_id=?', [req.body.user_id, req.body.email_id, req.body.network_id], function (err: any, result: any, fields: any) {
                            if (err) {
                                serverLog.error("In createUser ERROR CAME while userCheck ", err.code);
                                res.json({
                                    message: 'err: ' + err.message,
                                    statusCode: 500
                                });
                            } else {
                                if (result.length > 0) {//either user_id or email_id matches
                                    res.json({
                                        message: 'user already exist(either user_id or email_id or network_id matches)',
                                        statusCode: 501
                                    });
                                }
                                else {
                                    connection.query('INSERT INTO users set ?', [req.body], function (err: any, result: any, fields: any) {
                                        if (err) {
                                            serverLog.error("In createUser ERROR CAME while inserting ", err.code);
                                            res.json({
                                                message: 'err: ' + err.message,
                                                statusCode: 500
                                            });
                                        }
                                        else {
                                            connection.commit(function (err: any) {
                                                if (err) {
                                                    serverLog.error('In createUser Err while commiting : ', err.message);
                                                    connection.rollback(function () {
                                                        throw err;
                                                    });
                                                } else {
                                                    var reqData = {
                                                        "user_id": req.body.user_id,
                                                        "role_id": roleId,
                                                        "created_date": presentDate,
                                                        "updated_date": presentDate
                                                    }
                                                    connection.query('INSERT INTO user_roles set ?', [reqData], function (err: any, result: any, fields: any) {
                                                        if (err) {
                                                            serverLog.error('In createUser Err while insert Roles : ', err.message);
                                                            res.json({
                                                                message: 'Err : ' + err.message,
                                                                statusCode: 501
                                                            });
                                                        }
                                                        else {
                                                            connection.commit(function (err: any) {
                                                                if (err) {
                                                                    serverLog.error('In createUser Err while commiting insert Roles : ', err.message);
                                                                    connection.rollback(function () {
                                                                        throw err;
                                                                    });
                                                                } else {
                                                                    serverLog.info('Creating User Completed.');
                                                                    return res.json({
                                                                        message: "User succesfully added.",
                                                                        statusCode: 200
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                        })

                        connection.release();
                    })
                }
            });
        });

    }

    public async updateUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        req.body.email_id = req.body.email_id + "@quadratyx.com"
        serverLog.info("in update", req.params.id, "id is ", id, req.body)
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        var presentDate = resObj["date"]
                        connection.query(`SELECT * from users where ( email_id=? or network_id=? ) and user_id!=?`, [req.body.email_id, req.body.network_id, req.params.id], async function (err: any, result: any, fields: any) {
                            if (!err) {
                                if (result.length > 0) {
                                    return res.json({ message: "User already exist(either network_id or email_id matches)", statusCode: 501 });
                                }
                                else if (result.length == 0) {
                                    var qryList = [req.body.network_id, req.body.user_name, req.body.email_id, req.body.emp_group, req.body.is_billable, presentDate, id]
                                    connection.query("UPDATE users SET network_id=? ,user_name=? ,email_id=?,emp_group=?,is_billable=?,updated_date=? WHERE user_id = ?", qryList, function (err: any, result: any, fields: any) {
                                        if (!err) {
                                            connection.commit(function (err: any) {
                                                if (err) {
                                                    connection.rollback(function () {
                                                        throw err;
                                                    });
                                                    return res.json({ message: "ERROR CAME when updating user", statusCode: 500 });
                                                }
                                                else {
                                                    qryList = [req.body.role_id, presentDate, id]
                                                    connection.query('UPDATE user_roles set role_id=?,updated_date=? WHERE user_id = ?', qryList, function (err: any, result: any, fields: any) {
                                                        if (!err) {
                                                            connection.commit(function (err: any) {
                                                                if (err) {
                                                                    res.json({
                                                                        message: "Error: " + err.message,
                                                                        statusCode: 500
                                                                    });
                                                                    connection.rollback(function () {
                                                                        throw err;
                                                                    });
                                                                } else {
                                                                    serverLog.info('Updating User Done.');
                                                                    return res.json({ message: "User is updated successfully", statusCode: 200 });
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            serverLog.error("In updateUser ERROR CAME when updating user_roles ", err.code);
                                                            return res.json({ message: "ERROR CAME when updating user_roles", statusCode: 500 });
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                        if (err) {
                                            serverLog.error("In updateUser ERROR CAME when updating users ", err.code);
                                            return res.json({
                                                message: "Error: " + err.message,
                                                statusCode: 500
                                            });
                                        }
                                    })
                                }
                            }
                            if (err) {
                                return res.json({ message: "ERROR CAME when updating user", statusCode: 500 });
                            }
                        })

                        connection.release();
                    })
                }
            });
        });


    }

    public async deleteUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(async function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        var presentDate = resObj["date"]
                        connection.query('UPDATE users set status=0,updated_date=? WHERE user_id = ?', [presentDate, id], async function (err: any, result: any, fields: any) {
                            if (!err) {
                                await connection.commit(async function (err: any) {
                                    if (err) {
                                        connection.rollback(function () {
                                            throw err;
                                        });
                                        return res.json({ data: "Error occured", statusCode: 500 });
                                    }
                                    serverLog.info('Deleting User Done.(status 0 <-> 1)');
                                    if (!err) {
                                        await connection.query('update user_projects set status=0,updated_date=?  where user_id=?', [presentDate, id]);
                                        await connection.query('COMMIT');
                                        res.json({ data: result, statusCode: 200 })
                                    }
                                });
                            }
                            if (err) {
                                serverLog.error("In deleteUser ERROR CAME ", err.code);
                                res.json({ message: 'user already exist', statusCode: 501 });
                            }
                        })
                        await connection.query("COMMIT");

                        connection.release();
                    })
                }
            });
        });

    }

    public async prolist(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    const id = req.params.id
                    const role = req.params.role

                    var queryStr: any = `Select proj.id,proj.project_code,proj.project_code_old,proj.project_name,customers.name as customer_name,proj_t.description as service_line,users.user_name,proj.planned_start_date,proj.planned_end_date
                    from projects as proj
                    inner join users on users.user_id=proj.manager_id
                    inner join customers on customers.id=proj.customer_id
                    inner join project_type as proj_t on proj_t.id=proj.ptype_id
                    where proj.status=1 `
                    var options: any = []
                    if (role == "2") {
                        queryStr += " and proj.manager_id=? "
                        options.push(id)
                    }
                    queryStr += "\n\t order by proj.project_name"
                    connection.query(queryStr, options, function (err: any, result: any, fields: any) {
                        if (!err) {
                            res.json({ data: result, statusCode: 200 })
                        }
                        if (err) {
                            serverLog.error("In SpecificProlist err:", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });

    }

    //What we are calculating using this API
    public async getverifiedPro(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    const pid = req.params.pid
                    const uid = req.params.uid
                    connection.query(`SELECT * FROM projects
                        WHERE projects.manager_id=? AND projects.id=?`, [uid, pid], function (err: any, result: any, fields: any) {
                        if (!err) {
                            if (result.length == 0) {
                                return res.json({ data: 0, statusCode: 200 })
                            }
                            if (result.length > 0) {
                                return res.json({ data: 1, statusCode: 200 })
                            }
                        }
                        if (err) {
                            return res.json({ statusCode: 500 })
                        }
                    })

                    connection.release();
                }
            });
        });
    }

    public async getLatestProiD(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('SELECT * FROM projects WHERE customer_id=? AND ptype_id=?', [req.params.custId, req.params.PtypeId], function (err: any, result: any, fields: any) {
                        if (!err) {
                            res.json({ data: result, statusCode: 200 })

                        }
                        if (err) {
                            serverLog.error("In getLatestProiD err:", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });

    }

    public async getOnePro(req: Request, res: Response): Promise<any> {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    const { id } = req.params;
                    connection.query('SELECT * FROM projects WHERE id = ?', [id], function (err: any, result: any, fields: any) {
                        if (!err) {
                            if (result.length > 0) {
                                res.json({ data: result[0], statusCode: 200 })
                            }
                            else {
                                res.status(404).json({ text: "The project does not exist!" });
                            }
                        }
                        if (err) {
                            serverLog.error("In getOnePro err:", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });

    }

    public async createProject(req: Request, res: Response): Promise<void> {
        req.body.status = 1
        req.body.project_code = req.body.customer_code + req.body.project_code + "-" + req.body.p_type + req.body.BU_code
        delete req.body.customer_code
        delete req.body.p_type
        req.body["bu_id"] = req.body.BU_code
        delete req.body.BU_code

        req.body.p_catg_id == 1 ? req.body["is_billable"] = true : req.body["is_billable"] = false

        serverLog.info("createProject after", req.body)

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        var presentDate = resObj["date"]
                        req.body.updated_date = presentDate
                        req.body.created_date = presentDate
                        connection.query('select * from  projects where project_code=? or project_name=?', [req.body.project_code, req.body.project_name], function (err: any, result: any, fields: any) {
                            if (err) {
                                serverLog.error("In createProject err while checkProject :", err.message)
                                res.json({
                                    message: "Error: " + err.message,
                                    statusCode: 500
                                })
                            }
                            else {
                                if (result.length > 0) {//project already there
                                    res.json({
                                        message: 'project already exist(either project_code or project_name matches)',
                                        statusCode: 501
                                    })
                                }
                                else {
                                    connection.query('INSERT INTO projects set ?', [req.body], function (err: any, result: any, fields: any) {
                                        if (err) {
                                            serverLog.error("In createProject err while insertingProject :", err.message)
                                            res.json({
                                                message: "Error: " + err.message,
                                                statusCode: 500
                                            })
                                        }
                                        else {
                                            connection.commit(function (err: any) {
                                                if (err) {
                                                    serverLog.error('In createProject Err while commiting insert projects : ', err.message);
                                                    connection.rollback(function () {
                                                        throw err;
                                                    });
                                                } else {
                                                    serverLog.info('Creating Project Completed.');
                                                    return res.json({
                                                        message: "Project succesfully added.",
                                                        statusCode: 200
                                                    });
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                        })

                        connection.release();
                    })
                }
            });
        });
    }

    public async deleteproject(req: Request, res: Response): Promise<void> {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    const { id } = req.params;
                    connection.query(`SELECT CURRENT_TIMESTAMP`, async function (err: any, result: any, fields: any) {
                        var presentDate = new Date(result[0]['CURRENT_TIMESTAMP'])
                        connection.query(`UPDATE projects set status=0,updated_date=? WHERE id = ?`, [presentDate, id], async function (err: any, result: any, fields: any) {
                            if (err) {
                                res.json({ message: 'Prob while updating', status: 500 });
                            }
                            else {
                                connection.query(`COMMIT`, async function (err: any, result: any, fields: any) {
                                    if (err) {
                                        res.json({ message: 'Prob while commit', status: 500 });
                                    }
                                    else {
                                        await connection.query('update user_projects set status=0,updated_date=?  where project_id=?', [presentDate, id]);
                                        await connection.query('COMMIT');
                                        res.json({ message: 'The project was deleted!', status: 200 });
                                    }
                                })
                            }
                        })
                    })
                }
            });
        });

    }

    public async rolelist(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('SELECT * FROM roles', function (err: any, result: any, fields: any) {
                        if (!err) {
                            res.json({ data: result, statusCode: 200 })
                        }
                        if (err) {
                            serverLog.error("In rolelist err:", err)
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                    })

                    connection.release();
                }
            });
        });

    }
    //Projects functions

    public async updateSingleProject(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        req.body.p_catg_id == 1 ? req.body["is_billable"] = true : req.body["is_billable"] = false

        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(async function (err: any) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                } else {
                    getCurrentTimeStamp(connection, {}, async function (resObj: any) {
                        var presentDate = resObj["date"]
                        req.body.updated_date = presentDate
                        await connection.query('UPDATE projects set ? WHERE id = ?', [req.body, id]);
                        await connection.query("COMMIT");
                        res.json({ message: 'Project is updated successfully', statusCode: 200 })
                        connection.release();
                    })
                }
            });
        });

    }

    public async specficDatalist(req: Request, res: Response) {
        var uid = req.body.userid
        var pid = req.body.proid
        var st = req.body.start_date
        var end = req.body.end_date
        var query = "", listObj: any, type = ""

        if (uid.length > 0 && pid.length > 0) {
            listObj = [st, end, uid, pid]
            query = `select users.user_id,users.user_name,projects.project_name,projects.description,time_sheet.entry_date,
                time_sheet.start_time,time_sheet.end_time,time_sheet.duration as workedHrs
                from time_sheet 
                inner join projects on projects.id=time_sheet.project_id 
                inner join users on users.user_id=time_sheet.user_id
                where time_sheet.entry_date between ? and ? and time_sheet.user_id IN (?) and time_sheet.project_id IN (?) and users.status=1
                order by time_sheet.entry_date,time_sheet.start_time`

            type = "both"
        }
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query(query, listObj, function (err: any, result: any, fields: any) {
                        if (err) {
                            return res.json({ "error": err, statusCode: 500 })
                        } else {

                            result.filter((ele: any, idx: any) => {
                                var store = new Date(getDateStrFromDateObj(result[idx]["entry_date"]))
                                result[idx]["start_time"] = new Date(getDateStrFromDateObj(result[idx]["entry_date"]) + " " + result[idx]["start_time"])
                                result[idx]["end_time"] = new Date(getDateStrFromDateObj(result[idx]["entry_date"]) + " " + result[idx]["end_time"])
                                result[idx]["entry_date"] = store
                            })

                            return res.json({ "status": result, "type": type, statusCode: 200 })
                        }
                    });

                    connection.release();
                }
            });
        });
    }

    //customer API's
    public async getAllCustomers(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query(`select * from customers where status=1 order by name`, function (err: any, result: any, fields: any) {
                        if (err) {
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                        else {
                            res.json({ data: result, statusCode: 200 })
                        }
                    });

                    connection.release();
                }
            });
        });

    }

    public async getSingleCustomer(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query(`select * from customers where customers.id=? and status=1`, [req.params.id], function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("ERROR CAME when updating customers ", err.code);
                            return res.json({ data: "Error occured", statusCode: 500 });
                        }
                        else {
                            res.json({ data: result, statusCode: 200 })
                        }
                    });

                    connection.release();
                }
            });
        });

    }

    public async updateCustomer(req: Request, res: Response) {
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query(`SELECT CURRENT_TIMESTAMP`, async function (err: any, result: any, fields: any) {
                        var presentDate = new Date(result[0]['CURRENT_TIMESTAMP'])
                        await connection.query(`UPDATE customers SET name=?,BU_code= ? ,description=?,updated_date=? WHERE id = ?`, [req.body.name, req.body.BU_code, req.body.description, presentDate, req.body.id], function (err: any, result: any, fields: any) {
                            if (err) {
                                serverLog.error("ERROR CAME when updating customers ", err.code);
                                return res.json({ data: "Error occured", statusCode: 500 });
                            }
                            else {
                                res.json({ data: result, statusCode: 200 })
                            }
                        });
                        await connection.query("COMMIT");
                    })

                    connection.release();
                }
            });
        });


    }

    public async addNewCustomer(req: Request, res: Response): Promise<void> {
        req.body.status = 1
        delete req.body.country
        delete req.body.city
        delete req.body.mail
        delete req.body.fax
        delete req.body.phone
        delete req.body.mobile
        pool.getConnection(function (err: any, connection: any) {
            connection.beginTransaction(function (err: any) {
                if (err) {                  //Transaction Error (Rollback and release connection)
                    connection.rollback(function () {
                        connection.release();
                        //Failure
                    });
                } else {
                    connection.query('Select * from customers where customers.customer_code=? or customers.name=?', [req.body.customer_code, req.body.name], function (err: any, result: any, fields: any) {
                        if (err) {
                            serverLog.error("ERROR CAME while customersCheck ", err.code);
                            res.json({
                                message: 'err: ' + err.message,
                                statusCode: 500
                            });
                        } else {
                            if (result.length > 0) {//either user_id or email_id matches
                                res.json({
                                    message: 'customer already exist(either customercode or customer name matches)',
                                    statusCode: 501
                                });
                            }
                            else {
                                connection.query(`SELECT CURRENT_TIMESTAMP`, async function (err: any, result: any, fields: any) {
                                    var presentDate = new Date(result[0]['CURRENT_TIMESTAMP'])
                                    req.body.created_date = presentDate
                                    req.body.updated_date = presentDate
                                    connection.query('INSERT INTO customers set ?', [req.body], function (err: any, result: any, fields: any) {
                                        if (err) {
                                            serverLog.error("In addNewCustomer ERROR CAME while inserting ", err.code);
                                            res.json({
                                                message: 'err: ' + err.message,
                                                statusCode: 500
                                            });
                                        }
                                        else {
                                            connection.commit(function (err: any) {
                                                if (err) {
                                                    serverLog.error('In addNewCustomer Err while commiting : ', err.message);
                                                    connection.rollback(function () {
                                                        throw err;
                                                    });
                                                } else {
                                                    serverLog.info('Creating Customer Completed.');
                                                    return res.json({
                                                        message: "Customer succesfully added.",
                                                        statusCode: 200
                                                    });
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                        }
                    })

                    connection.release();
                }
            });
        });

    }

}

const adminController = new AdminController();
export default adminController;