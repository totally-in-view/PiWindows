let io = require("socket.io");
let sizeof = require("sizeof");
let process = require("process");
let path = require("path");
let db = require("better-sqlite3")(path.join(__dirname, "pi-diagnostics.db"));


let sql = require("sql");
let Table = sql.Table;
let server = io.listen(4343);
server.set("transports", ["websocket"])

// console.log(db);
sql.setDialect("sqlite");
let tables = {}

function clearDatabase(database){
    let scripts = database.prepare("select 'drop table ' || name || ';' from sqlite_master where type = 'table'").all();
    scripts.forEach((script)=>{
        for(var prop in script){
            if(!script[prop].includes("analytics_devices_table")){
                database.prepare(script[prop]).run();
            }else{
                database.prepare("DELETE FROM analytics_devices_table").run();
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
let analyticsStatements = [];

let analyticsInterval = setInterval(()=>{
    if(sizeof.sizeof(analyticsStatements) < 50000){
        analyticsStatements.forEach((statement)=>{
            statement.run();
        });
        analyticsStatements = [];
    }
}, 1000)

server.on("connection", (socket)=>{
    socket.on("purge", ()=>{
        clearDatabase(db);
    })


    socket.on("pi-device-status", async (data, clientId)=>{
        // console.log(data);
        let {instanceId, res} = data;
        let resArray = res.split("_");
        const tableName = `analytics_${clientId}_${instanceId}_${resArray[0]}_${resArray[1]}`;
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
        cols.push({
            name: "clientId",
            dataType: "INTEGER"
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
                await db.prepare(`INSERT INTO analytics_devices_table ("device", "instanceId", "color", "clientId") VALUES ("${tableName}", ${instanceId}, "${getRandomColor()}", ${clientId})`).run();
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

    socket.on("set-analytics-devices",async (devices, clientId)=>{
        for await(let device of devices){
            if(device.serialnumber != null){
                let deviceTable = `network_${clientId}_${device.instanceId}_${device.type.toLowerCase().replace(/[-.]/g, "_")}_${device.id}`
                let statement = `CREATE TABLE IF NOT EXISTS ${deviceTable} (online INTEGER, eventTime INTEGER);`
                try{
                    db.prepare(statement).run();
                }catch(err){
                    console.log(err)
                }
                statement = `INSERT INTO analytics_devices_table ("device", "instanceId", "color", "clientId") VALUES ("${deviceTable}", ${device.instanceId}, "${getRandomColor()}", ${clientId})`
                try{
                    db.prepare(statement).run();
                }catch(err){

                }
                let date = new Date();
                let status = device.online == "true" ? 100 : 0
                statement = `INSERT INTO ${deviceTable} (online, eventTime) VALUES (${status}, ${date.getTime()})`
                try{
                    analyticsStatements.push(db.prepare(statement));
                }catch(err){}
            }
            
        }
    })

    socket.on("update-analytics-device", (device, clientId)=>{
        let date = new Date();
        let status = device.online == "true" ? 100 : 0;
        
        let deviceTable = `network_${clientId}_${device.instanceId}_${device.type.toLowerCase().replace(/[-.]/g, "_")}_${device.id}`
        
        let statement = `INSERT INTO ${deviceTable} (online, eventTime) VALUES (${status}, ${date.getTime()})`;

        try{
            analyticsStatements.push(db.prepare(statement));
        }catch(err){
            console.log(err);
        }
    });

    socket.on("get-pi-devices", (instance, clientId)=>{
        let devices = [];
        try{
            // console.log(instance);
            devices = db.prepare(`SELECT * FROM analytics_devices_table WHERE instanceId=${instance} AND clientId=${clientId}`).all();
        }catch(err){
            // printErrorMessage(`${err}`)
        }
        let data = [];
        // console.log(devices);
        devices.forEach((device)=>{
            data.push({
                device: device.device,
                color: device.color,
                dataPoints: db.prepare(`SELECT * FROM ${device.device}`).all()
            })
        });
        socket.emit("pi-devices-response", data);
    });

    socket.on("light-color-request", (light, clientId)=>{
        let statement = `SELECT color FROM analytics_devices_table WHERE device="analytics_${clientId}_${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}"`;
        try{
            let color = db.prepare(statement).get().color;
            socket.emit("light-color-res", light, color);
        }catch(err){

        }
    })

    socket.on("filter-network-devices", (instance, filter, clientId)=>{
        let devices = [];
        let data = [];
        try{
            devices = db.prepare(`SELECT * FROM analytics_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${clientId}_${instance.id}_${filter}_%"`).all();
        }catch(err){

        }
        
        devices.forEach((device)=>{
            data.push({
                device: device.device,
                color: device.color,
                dataPoints: db.prepare(`SELECT * FROM ${device.device}`).all()
            })
        });
        socket.emit("network-devices-filtered", data)
    })

    socket.on("get-donut-network-data", (instance, clientId)=>{
        let devices = [];
        let data = {};
        try{
            devices = db.prepare(`SELECT * FROM analytics_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${clientId}_${instance.id}_%"`).all();
        }catch(err){

        }

        devices.forEach((device)=>{
            let type = device.device.split("_")[3];
            try{
                let status = db.prepare(`SELECT * FROM ${device.device} WHERE eventTime = (SELECT MAX(eventTime) FROM ${device.device})`).get().online;
            status = status == 100 ? "online": "offline"
            if(data[type] != null){
                data[type].push(status)
            }
            else{
                data[type] = [status];
            }   
        }catch(err){

        }     
        })
        socket.emit("donut-data-return", data);
    })

    socket.on("get-bar-network-data", (instance)=>{
        let devices = [];
        let data = {};
    
        let days = [];
        for(let i = 0; i < 5; i++){
            let day = new Date();
            day.setDate(day.getDate()-i);
            days[i] = {
                beginning: day.setHours(0, 0, 0, 0),
                end: day.setHours(23, 59, 59, 0),
                status: {}
                }
            }
        try{
            devices = db.prepare(`SELECT * FROM analytics_devices_table WHERE instanceId=${instance.id} AND device LIKE "network_${instance.id}_%"`).all();
        }catch(err){

        }

        devices.forEach((device)=>{
            let type = device.device.split("_")[2]
            // console.log(days);
            days.forEach((day)=>{
                let eventTime = db.prepare(`SELECT MAX(eventTime) FROM ${device.device} WHERE eventTime BETWEEN ${day.beginning} AND ${day.end}`).get()['MAX(eventTime)'];
                if(eventTime != null){
                    let status = db.prepare(`SELECT * FROM ${device.device} WHERE eventTime=${eventTime}`).online == 100 ? "Online" : "Offline"
                    if(day["status"][type] != null){
                        if(status == "Online"){
                            day["status"][type]["online"].push(device.device);
                        }else{
                            day["status"][type]["online"].push(device.device);
                        }
                    }else{
                        day["status"][type] = {
                            online: [],
                            offline: []
                        }

                        if(status == "Online"){
                            day["status"][type]["online"].push(device.device);
                        }else{
                            day["status"][type]["offline"].push(device.device);
                        }
                    }
                }
                
                // status = status == 100 ? "online": "offline"
            })            
            
            // if(data[type] != null){
            //     data[type].push(status)
            // }
            // else{
            //     data[type] = [status];
            // }        
        })

        days.sort((a, b)=>{
            return a.beginning - b.beginning
        })
        socket.emit("bar-network-data", days)
    });

    // socket.on("get-analytics-report", ()=>{
    //     let devices = db.prepare(`SELECT * FROM analytics_devices_table`).all();
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
    //                 name = db.prepare(`SELECT name FROM analytics_${type}_table WHERE id=${device.device.split("_")[3]}`).get().name;
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
})

