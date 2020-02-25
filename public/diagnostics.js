let io = require("socket.io");
let sizeof = require("sizeof");
let process = require("process");
let path = require("path");
// let client = require("socket.io-client")
// let chalk = require("chalk");
// let db = isDev ? require("better-sqlite3")(`./public/pi-diagnostics.db`) : require("better-sqlite3")(`./build/pi-diagnostics.db`);
let db = require("better-sqlite3")(path.join(__dirname, "pi-diagnostics.db"));
let sql = require("sql");
let Table = sql.Table;
let server = io.listen(4242);
let fs = require("fs")
server.set("transports", ["websocket"])
// console.log(db);
sql.setDialect("sqlite");
let tables = {
    diagnosticTable: sql.define({
        name: "diagnostic_log_table",
        columns: ['id', 'log', 'eventTime', 'instanceId', 'instanceName']
    })
}

// function printErrorMessage(err){
//     console.log(`${chalk.red.bgBlack("Error:")} ${err}`);
// }

// function debug(message){
//     console.log(`${chalk.magenta("Debugging")}: ${message}`)
// }

function clearDatabase(database){
    let scripts = database.prepare("select 'drop table ' || name || ';' from sqlite_master where type = 'table'").all();
    scripts.forEach((script)=>{
        for(var prop in script){
            try{
                if(!script[prop].includes("diagnostic_log_table")  && !script[prop].includes("diagnostic_device_types_table") && !script[prop].includes("diagnostic_devices_table")){
                    
                    database.prepare(script[prop]).run();
                }else{
                    database.prepare("DELETE FROM diagnostic_device_types_table").run();
                    database.prepare("DELETE FROM diagnostic_log_table").run();
                    database.prepare("DELETE FROM diagnostic_devices_table").run();
                }
            }catch(err){
                // printErrorMessage(err);
            }
        }
    })  
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
// let entries = tables.diagnosticTable.select(tables.diagnosticTable.star()).from(tables.diagnosticTable).toQuery().text;
// console.log(tables.diagnosticTable.create(tables.diagnosticTable).toQuery().text)
// console.log(db.prepare(entries).all());

let diagnosticStatements = [];
// let diagnosticInterval = setInterval(()=>{
//     // console.log(sizeof.sizeof(diagnosticStatements))
//     if( sizeof.sizeof(diagnosticStatements) < 50000){
//         diagnosticStatements.forEach((statement)=>{
//             console.log(statement)
//             statement.run();
//         })    
//         diagnosticStatements = [];
//     }
// }, 1000)



server.on("connection", (socket)=>{
    // console.log(server.sockets)
    console.log("Connected!");
    socket.on("purge", ()=>{
        clearDatabase(db);
    });
    socket.on("update-diagnostic-log", (log, instance)=>{
        // let statement = tables.diagnosticTable.insert(log).toQuery();
        try{
            db.prepare(log).run();
        }catch(err){
            console.log(err);
            // printErrorMessage(err);
        }

        // socket.emit("update-diagnostics", {id: instance.id});
    });

    socket.on("get-diagnostics", (client, limiter, deviceFilter = null)=>{
        let statement;
        if(deviceFilter != null){
            statement =`SELECT log, eventTime, instanceName, instanceId, clientId FROM diagnostic_log_table WHERE clientId=${client} AND deviceFilter=${deviceFilter} LIMIT 50`
        }else{
            statement =`SELECT log, eventTime, instanceName, instanceId, clientId FROM diagnostic_log_table WHERE clientId=${client} LIMIT 50`
        }
        let filters = `SELECT DISTINCT deviceFilter FROM diagnostic_log_table;`
        if(limiter > 1){
            statement = `${statement} OFFSET ${(limiter-1)*50}`
        }
        try{
            let dbStatement = db.prepare(statement);
            var logs = dbStatement.all();
            let deviceFilters = db.prepare(statement).all();
            let numberOfEntries = db.prepare(`SELECT count(id) FROM diagnostic_log_table WHERE clientId = ${client}`).get();
            socket.emit("diagnostics-response", {logs, numberOfEntries: numberOfEntries[`count(id)`], deviceFilters});
        }catch(err){
            console.log(err);
            console.log(statement);
        }
    })

    socket.on("pi-device-status", async (data)=>{
        // console.log(data);
        let {instanceId, res} = data;
        let resArray = res.split("_");
        const tableName = `diagnostic_${instanceId}_${resArray[0]}_${resArray[1]}`;
        let cols = [];
        let isHVAC = false
        if(resArray[0].includes("hvac")){
            isHVAC = true;
            cols = [
                {
                    name: 'heat',
                    dataType: 'INTEGER',
                },
                {
                    name: 'room',
                    dataType: 'INTEGER',
                },
                {
                    name: 'cool',
                    dataType: 'INTEGER',
                },  
            ]

        }else if(resArray[0].includes('load') || resArray[0].includes('shade')){
            cols.push({
                name: 'level',
                dataType: 'INTEGER'
            });            
        }
        cols.push({
            name: 'eventTime',
            dataType: 'INTEGER'
        })
        tables[tableName] = Table.define({
            name: tableName,
            columns: cols
        })
        try{
            if(tableName.includes("vantage")){
                let statement = tables[tableName].create().ifNotExists().toQuery().text
                // debug(statement)
                await db.prepare(statement).run();
               
            }
            
        }catch(err){
            // printErrorMessage(`${err}` )
        }
        try{
            if(tableName.includes("vantage")){
                await db.prepare(`INSERT INTO diagnostic_devices_table ("device", "instanceId", "color") VALUES ("${tableName}", "${instanceId}", "${getRandomColor()}")`).run();
            }
        }catch(err){
            // printErrorMessage(`${err}`)
        }
        try{
            let statement;
            if(isHVAC == true){
                // console.log(resArray);
                statement = `INSERT INTO ${tableName} ("${resArray[2]}", "eventTime") VALUES (${resArray[3]}, ${new Date().getTime()})`
                
                // console.log(statement)
            }else{
                if(tableName.includes("vantage")){
                    statement = `INSERT INTO ${tableName} ("level", "eventTime") VALUES (${resArray[2]}, ${new Date().getTime()})`;
                    
                }   
            }
            if(statement != null){
                // debug(statement);
                analyticsStatements.push(db.prepare(statement));
            }
        }catch(err){
            // printErrorMessage(`${chalk.red(`pi-device-status:`)}${err}`)
        }
        let event = `${instanceId}_${resArray[0].toLowerCase()}_${resArray[1]}_res`;
        // console.log(resArray.splice(2));
        server.sockets.emit("pi-device-response", event, resArray.splice(2));
        server.sockets.emit("update-pi-graphs", instanceId)
    })

    socket.on("create-diagnostic-table", (statement)=>{
        try{
            db.prepare(statement).run();
        }catch(err){
            // printErrorMessage(`${err} - Line 119`);
        }
    });

    socket.on("insert-into-diagnostic-table", (statements)=>{
        let statement = "";
        let device = statements.device;
            let props = Object.keys(device);
            let cols = db.prepare(`PRAGMA table_info(diagnostic_${statements.device.type.replace(/[=.]/g, "_").toLowerCase()}_table)`).all();
            for(let prop of props){
                let index = cols.findIndex(col=>{
                    return col.name == prop
                })

                if(index < 0){
                    try{
                        db.prepare(`ALTER TABLE diagnostic_${statements.device.type.replace(/[=.]/g, "_").toLowerCase()}_table ADD ${prop} TEXT`).run();
                    }catch(err){
                    }
                }
            }
        try{
            db.prepare(statements.type).run();
        }catch(err){
            console.log(err);
        }finally{
            console.log(statements.insert);
        }
        try{
            device = db.prepare(`SELECT * FROM diagnostic_${statements.device.type.replace(/[=.]/g, "_").toLowerCase()}_table WHERE id="${statements.device.id}" AND instanceId="${statements.device.instanceId}"`).get();
            if(device == null){
                db.prepare(statements.insert).run();
            }else{
                statement = `UPDATE diagnostic_${statements.device.type.replace(/[=.]/g, "_").toLowerCase()}_table SET `
                for(let prop in device){
                    if(prop != "id" && prop != "instanceId"){
                        statement += `${prop} = "${device[prop]}", `;
                    }
                }

                statement = statement.substring(0, statement.length-2);
                statement += ` WHERE id="${statements.device.id}" AND instanceId="${statements.device.instanceId}"`;
                db.prepare(statement).run()
            }
            
        }catch(err){
            console.log(statements)
            console.log(err);
        }
    })

    // socket.on("set-diagnostic-devices",async (devices)=>{
    //     for await(let device of devices){
    //         if(device.serialnumber != null){
    //             let deviceTable = `network_${device.instanceId}_${device.type.toLowerCase().replace(/[-.]/g, "_")}_${device.id}`
    //             let statement = `CREATE TABLE IF NOT EXISTS ${deviceTable} (online INTEGER, eventTime INTEGER);`
    //             try{
    //                 db.prepare(statement).run();
    //             }catch(err){
    //                 // console.log(err)
    //             }
    //             statement = `INSERT INTO diagnostic_devices_table ("device", "instanceId", "color") VALUES ("${deviceTable}", ${device.instanceId}, "${getRandomColor()}")`
    //             try{
    //                 db.prepare(statement).run();
    //             }catch(err){

    //             }
    //             let date = new Date();
    //             let status = device.online == "true" ? 100 : 0
    //             statement = `INSERT INTO ${deviceTable} (online, eventTime) VALUES (${status}, ${date.getTime()})`
    //             try{
    //                 analyticsStatements.push(db.prepare(statement));
    //             }catch(err){}
    //         }
            
    //     }
    // })

    // socket.on("update-diagnostic-device", (device)=>{
    //     let date = new Date();
    //     let status = device.online == "true" ? 100 : 0;
        
    //     let deviceTable = `network_${device.instanceId}_${device.type.toLowerCase().replace(/[-.]/g, "_")}_${device.id}`
        
    //     let statement = `INSERT INTO ${deviceTable} (online, eventTime) VALUES (${status}, ${date.getTime()})`;

    //     try{
    //         analyticsStatements.push(db.prepare(statement));
    //     }catch(err){
    //         console.log(err);
    //     }
    // })
    socket.on("get-diagnostic-devices", (instance)=>{
        let diagnosticDeviceTypes = db.prepare("SELECT * FROM diagnostic_device_types_table").all();
        let devicesFromDB = [];
        for(const type of diagnosticDeviceTypes){
            try{
                devicesFromDB = devicesFromDB.concat(db.prepare(`SELECT * FROM ${type.deviceType} WHERE instanceId="${instance.id}"`).all());
                // debug(type.deviceType)
            }catch(err){
                console.log(err)
                // printErrorMessage(`${err}`);
            }
        }
        // console.log(devicesFromDB);
        socket.emit("diagnostic-devices-response", instance, devicesFromDB);
    });

    socket.on("get-diagnostic-devices-trigger",async  ()=>{
        let diagnosticDeviceTypes = db.prepare("SELECT * FROM diagnostic_device_types_table").all();
        let devicesFromDB = [];
        diagnosticDeviceTypes.forEach((type)=>{
            let devices = db.prepare(`SELECT * FROM ${type.deviceType}`).all()    
            devicesFromDB = devicesFromDB.concat(devices);
        })
        socket.emit("diagnostic-devices-trigger-response", devicesFromDB);
    })
    // socket.on("get-pi-devices", (instance)=>{
    //     let devices = [];
    //     try{
    //         // console.log(instance);
    //         devices = db.prepare(`SELECT * FROM diagnostic_devices_table WHERE instanceId=${instance}`).all();
    //     }catch(err){
    //         // printErrorMessage(`${err}`)
    //     }
    //     let data = [];
    //     // console.log(devices);
    //     devices.forEach((device)=>{
    //         data.push({
    //             device: device.device,
    //             color: device.color,
    //             dataPoints: db.prepare(`SELECT * FROM ${device.device}`).all()
    //         })
    //     });
    //     // console.log(data);
    //     socket.emit("pi-devices-response", data);
    // });

    socket.on("log-request", (instance)=>{
        let logs = [];
        try{
            // console.log(instance)
            let numberOfEntries = db.prepare(`SELECT count(id) FROM diagnostic_log_table`).get();
            // console.log(numberOfEntries['count(id)']-100)
            logs = db.prepare(`SELECT log FROM diagnostic_log_table WHERE instanceId="${instance.id}" ORDER BY eventTime DESC LIMIT 100;`).all()
            logs = logs.reverse();
            // console.log(logs);
        }catch(err){
            // printErrorMessage(`${err}`)
        }

        socket.emit("terminal-logs", logs, instance)
        
    })

    socket.on("filter-log", (searchWord, filterBy)=>{
        let results = [];
        let numberOfEntries = 0;
        if(filterBy.toLowerCase() == "log"){ 
            try{
                results = db.prepare(`SELECT * FROM diagnostic_log_table WHERE log LIKE "%${searchWord}%"`).all();
                numberOfEntries = db.prepare(`SELECT count(id) FROM diagnostic_log_table WHERE log LIKE "%${searchWord}%"`).get()[`count(id)`];
            }catch(err){
                // printErrorMessage(`${err}`);
            }
        }else if(filterBy.toLowerCase() == "instance"){
            try{
                results = db.prepare(`SELECT * FROM diagnostic_log_table WHERE instanceId="${searchWord}"`).all()
                numberOfEntries = db.prepare(`SELECT count(id) FROM diagnostic_log_table WHERE instanceId="${searchWord}"`).get()[`count(id)`];
            }catch(err){
                // printErrorMessage(`${err}`);
            }
        }else if(filterBy.toLowerCase().includes("event time")){
            try{
                let searchDateRange = searchWord.replace("Event Time: ", "").trim().split("-");
            let lowerValue = new Date(searchDateRange[0]);
            let upperValue = new Date(searchDateRange[1]);
            // console.log(lowerValue.getTime(), upperValue.getTime())
            results = db.prepare(`SELECT * FROM diagnostic_log_table WHERE eventTime BETWEEN ${lowerValue.getTime()} AND ${upperValue.getTime()}`).all();
            numberOfEntries = db.prepare(`SELECT count(eventTime) FROM diagnostic_log_table WHERE eventTime BETWEEN ${lowerValue.getTime()} AND ${upperValue.getTime()}`).get()[`count(eventTime)`];
            }catch(err){
                // printErrorMessage(`${err}`)
            }
        }

        socket.emit("diagnostics-response", {logs: results, numberOfEntries: numberOfEntries});
    });

    socket.on("clear-db", (id)=>{
        let tableNames = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name LIKE "diagnostic_${id}_%"`).all();

        tableNames.forEach((table)=>{
            db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
        });

        let deviceTypes = db.prepare(`SELECT * FROM diagnostic_device_types_table`).all();

        deviceTypes.forEach((deviceType)=>{
            db.prepare(`DELETE FROM ${deviceType.deviceType} WHERE instanceId="${id}"`).run();
        });

        // db.prepare(`DELETE FROM diagnostic_devices_table WHERE instanceId=${id}`).run();

        db.prepare(`DELETE FROM diagnostic_log_table WHERE instanceId="${id}"`).run();
    })

    socket.on("clear", ()=>{
        console.log("Clearing Database!");
        clearDatabase(db);
    })

    // socket.on("light-color-request", (light)=>{
    //     let statement = `SELECT color FROM diagnostic_devices_table WHERE device="diagnostic_${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}"`;
    //     let color = db.prepare(statement).get().color;
    //     console.log(color);
    //     socket.emit("light-color-res", light, color);

    // })

    // socket.on("filter-network-devices", (instance, filter)=>{
    //     let devices = [];
    //     let data = [];
    //     try{
    //         console.log(filter);
    //         devices = db.prepare(`SELECT * FROM diagnostic_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${instance.id}_${filter}_%"`).all();
    //     }catch(err){

    //     }
    //     console.log(devices);
    //     devices.forEach((device)=>{
    //         data.push({
    //             device: device.device,
    //             color: device.color,
    //             dataPoints: db.prepare(`SELECT * FROM ${device.device}`).all()
    //         })
    //     });

    //     socket.emit("network-devices-filtered", data)
    // })

    // socket.on("get-donut-network-data", (instance)=>{
    //     let devices = [];
    //     let data = {};
    //     try{
    //         devices = db.prepare(`SELECT * FROM diagnostic_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${instance.id}_%"`).all();
    //     }catch(err){

    //     }

    //     devices.forEach((device)=>{
    //         let type = device.device.split("_")[2]
    //         let status = db.prepare(`SELECT * FROM ${device.device} WHERE eventTime = (SELECT MAX(eventTime) FROM ${device.device})`).get().online;
    //         status = status == 100 ? "online": "offline"
    //         if(data[type] != null){
    //             data[type].push(status)
    //         }
    //         else{
    //             data[type] = [status];
    //         }        
    //     })

    //     socket.emit("donut-data-return", data);
    // })

    // socket.on("get-bar-network-data", (instance)=>{
    //     let devices = [];
    //     let data = {};

    //     let days = [];
    //     for(let i = 0; i < 5; i++){
    //         let day = new Date();
    //         day.setDate(day.getDate()-i);
    //         days[i] = {
    //             beginning: day.setHours(0, 0, 0, 0),
    //             end: day.setHours(23, 59, 59, 0),
    //             status: {}
    //             }
    //         }
    //     try{
    //         devices = db.prepare(`SELECT * FROM diagnostic_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${instance.id}_%"`).all();
    //     }catch(err){

    //     }

    //     devices.forEach((device)=>{
    //         let type = device.device.split("_")[2]
    //         // console.log(days);
    //         days.forEach((day)=>{
    //             let eventTime = db.prepare(`SELECT MAX(eventTime) FROM ${device.device} WHERE eventTime BETWEEN ${day.beginning} AND ${day.end}`).get()['MAX(eventTime)'];
    //             if(eventTime != null){
    //                 let status = db.prepare(`SELECT * FROM ${device.device} WHERE eventTime=${eventTime}`).online == 100 ? "Online" : "Offline"
    //                 if(day["status"][type] != null){
    //                     if(status == "Online"){
    //                         day["status"][type]["online"].push(device.device);
    //                     }else{
    //                         day["status"][type]["online"].push(device.device);
    //                     }
    //                 }else{
    //                     day["status"][type] = {
    //                         online: [],
    //                         offline: []
    //                     }

    //                     if(status == "Online"){
    //                         day["status"][type]["online"].push(device.device);
    //                     }else{
    //                         day["status"][type]["offline"].push(device.device);
    //                     }
    //                 }
    //             }
                
    //             // status = status == 100 ? "online": "offline"
    //         })            
            
    //         // if(data[type] != null){
    //         //     data[type].push(status)
    //         // }
    //         // else{
    //         //     data[type] = [status];
    //         // }        
    //     })

    //     days.sort((a, b)=>{
    //         return a.beginning - b.beginning
    //     })
    //     socket.emit("bar-network-data", days)
    // });

    // socket.on("get-analytics-report", ()=>{
    //     let devices = db.prepare(`SELECT * FROM diagnostic_devices_table`).all();
    //     let report = []
    //     devices.forEach((device)=>{
    //         let data = db.prepare(`SELECT * FROM ${device.device}`).all();
    //         let name = device.device
    //         if(device.device.includes("network")){
    //             let type = device.device.split("_")[2];
    //             data.forEach((point)=>{
    //                 if(point == 100){
    //                     point.online = "Online"
    //                 }else{
    //                     point.online = "Offline"
    //                 }
    //             });
    //             try{
    //                 name = db.prepare(`SELECT name FROM diagnostic_${type}_table WHERE id=${device.device.split("_")[3]}`).get().name;
    //             }catch(err){

    //             }
                
    //         }
    //         report.push({
    //             name: name,
    //             data: data
    //         });
    //     });
    //      socket.emit("analytics-report-return", report);
    // });
    
    socket.on("diagnostic-devices-req", (id)=>{
        try{
            
            let types = db.prepare(`SELECT * FROM diagnostic_device_types_table`).all();
            let diagnosticDevices = {}

            for(const type of types){
                let devices = db.prepare(`SELECT * FROM ${type.deviceType}`).all();
                for(const device of devices){
                    if(diagnosticDevices[device.instanceId] != null){
                        diagnosticDevices[device.instanceId].push(device);
                    }else{
                        diagnosticDevices[device.instanceId] = [device];
                    }
                }
            }
            socket.emit("diagnostic-devices-res", id, diagnosticDevices);
        }catch(err){
            console.log(err);
        }
        
    })
});

// process.stdin.on("data", (data)=>{
//     if(data.toString("utf8").toLowerCase().includes("clear")){
//         clearDatabase(db);
//     }
// })

process.on("message", (event)=>{
    // console.log(event);
    if(event == "close"){
        server.close();
        process.kill();
    }else if(event == "clear"){
        // console.log("Clearing Database!");
        clearDatabase(db);
    }
    // console.log(server);
})