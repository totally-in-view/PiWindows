const net = require("net");
const fs = require("fs");
const path = require("path");
const client = require("socket.io-client");
const request = require("request");
var slash = process.platform == "darwin" ? "/" : "\\"
const {convertVantage} = require(path.join(__dirname, "PI"));
const database = require(`better-sqlite3`)(path.join(__dirname, `ph-devices-table.db`));
let instances = [];
let user;
let socket;
let helperSocket;
let diagnosticSocket;
let analyticsSocket;
try{
    let user = database.prepare("SELECT * FROM user_table WHERE id=1").get();
    let adminSettings = database.prepare(`SELECT * FROM admin_settings WHERE id=1`).get();
    socket = client("http://localhost:3031", {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false})
    helperSocket = null;
    // let helperSocket = client(adminSettings.helper, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
    diagnosticSocket;
    analyticsSocket;
    if(user.permission == "client"){
        diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
        diagnosticSocket.on("connect_timeout", ()=>{
            diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
        })
    }else if(user.permission == "analytics"){
        diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
        diagnosticSocket.on("connect_timeout", ()=>{
            diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
        })
        analyticsSocket = client(adminSettings.analytics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade: false, forceNew: false});
        analyticsSocket.on("connect_timeout", ()=>{
            analyticsSocket = client(adminSettings.analytics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade: false, forceNew: false});
        })
    }
   
    // postMessage(workerResult);
}catch(err){
    console.log(err)
}
function createBackEndInstance(instance, db, socket, diagnosticSocket, helperSocket, analyticsSocket){    
    let client = {};
    try{
        client = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
    }catch(err){
        console.log(err)
    }finally {
        client = {clientId: 14}
    }
    switch(instance.service){
        case "Telnet":
            let telsocket = net.createConnection({port: parseInt(instance.port), host: instance.address});
            telsocket.setTimeout(360000);
            let runtimeInstance = {...instance};
            let status = "online";
            runtimeInstance.service = {
                type: instance.service,
                connection: null
            };
            runtimeInstance.service.connection = telsocket;
            // runtimeInstance.service.connection.setKeepAlive(true, 5000);
            runtimeInstance.service.connection.write("STATUS ALL\r\n");
            runtimeInstance.service.connection.on("error", (err)=>{
                console.log(err);
                status = "offline";
                socket.emit("helper-passed-event", `instance-${instance.id}-status`, status)
                socket.emit("helper-passed-event", `instance-status`, {instance: runtimeInstance, status: "offline"})
            });
            runtimeInstance.service.connection.on("connect", ()=>{
                socket.emit("helper-passed-event",`instance-status`, {instance: runtimeInstance, status: "online"});
                socket.emit("helper-passed-event",`instance-${instance.id}-status`, "online" );
            })
            runtimeInstance.service.connection.on("data", async (buffer)=>{
                let date = new Date();
                let resArr = buffer.toString("utf8").replace(/"/g, "'").split("\r\n");
                status = "online";
                let file = fs.readFileSync(`${__dirname}${slash}file.json`);
                let fileJSON = JSON.parse(file);
                let device;
                resArr.forEach((res)=>{
                    let response = convertVantage(res);
                    let resArray = response.split("_");
                    if(response != null){ 
                        if(!response.includes("ERROR") && !response.includes("STATUS") && !response.includes("task")){
                            if(analyticsSocket != null){
                                analyticsSocket.emit("pi-device-status", {instanceId: instance.id, res: response}, client["clientId"]);
                            }else{
                                if(resArray[0].toLowerCase().includes("load")){
                                    socket.emit(`helper-passed-event`, `${instance.id}_light_donut_event`, [`${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, resArray.splice(2)])
                                }else if(resArray[0].toLowerCase().includes("hvac")){
                                    socket.emit(`helper-passed-event`, `${instance.id}_temp_donut_event`, [`${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, resArray.splice(2)])
                                }
                                resArray = response.split("_");

                                socket.emit(`helper-passed-event`,  `${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, resArray.splice(2))
                            }
                        }
                           
                   
                    try{
                        device = fileJSON.devices.find((value, index)=>{
                            return value.props.type.toLowerCase() == resArray[0] && value.props.id == resArray[1] && value.props.instanceId.id == instance.id
                        })
                        }catch(err){
                            console.log(err);
                        }   
                        if(device != null){
                            
                            if(device.props.type.toLowerCase().includes("hvac")){
                                diagnosticLog = `${device.props.name}: ${response.split("_")[3]}`
                            }else{
                                diagnosticLog = `${device.props.name}: ${response.split("_")[2]}`
                            }

                        }else{
                            diagnosticLog = response;
                        }
                    }else if(response.includes("STATUS")){
                        diagnosticLog = `${instance.name}: Online!`
                        socket.emit(`instance-status`, {instance: instance, status: "online"})
                    }
                    else{
                        diagnosticLog = response;
                    }
                try{
                    if(diagnosticLog != ""){
                        if(device == null){
                            device = {
                                        props:{
                                            type: "N/A"
                                        }
                                     }    
                        }
                        let client = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                        let diagnosticStatement = `INSERT INTO diagnostic_log_table (log, eventTime, instanceName, instanceId, clientId, deviceFilter) VALUES ("${diagnosticLog}", ${date.getTime()}, "${instance.name}", "${instance.id}", ${client["clientId"]}, "${device.props.type}")`
                        diagnosticSocket.emit("update-diagnostic-log", diagnosticStatement, instance)
                    }
                }catch(err){
                    console.log(err);
                }
                })
                // resArr.forEach((res)=>{
                //     if(res != ""){
                //     let response = convertVantage(res);
                //     let diagnosticLog;
                //     if(response != null){
                //         if(!response.includes("ERROR") && !response.includes("STATUS") && !response.includes("task")){
                //             let resArray = response.split("_");
                //             if(analyticsSocket != null){
                //                 analyticsSocket.emit("pi-device-status", {instanceId: instance.id, res: response}, client["clientId"]);
                //             }else{
                //                 socket.emit(`${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, ...resArray.splice(2));
                //             }

            });
            return {instance: runtimeInstance, status: status};
        case "REST":
            runtimeInstance = {...instance};
            runtimeInstance.service = {
                type: instance.service,
                connection: null
            }
            status = "online"
            return {
                instance: runtimeInstance,
                status: status
            }
        default:
                instance.service = {
                    type: instance.service,
                    connection: null
                }
            return {
                instance: instance,
                status: "online"
            }
    }
}

function writeToInstance(command, instance){
    switch(command.service){
        case "Telnet":
            instance.service.connection.write(command.body.toString("utf8"));
            break;
        case "REST":
            let request = require("request");
            if(instance.service.type == "PhillipsHue"){
                let url = `http://${instance.address}/api/${instance.token}${command.path}`;
                if(command.body == null){
                    
                    request({
                        uri: url,
                        method: command.method,
                    }, (err, res, body) =>{
                        if(err){
                            console.log(err);
                        }else{
                            console.log(body);
                        }
                    }); 
                    
                }else{
                    request({
                        uri: url,
                        method: command.method,
                        json: true,
                        body: command.body
                    }, (err, res, body) =>{
                        if(err){
                        }else{
                            console.log(body);
                        }
                    }); 
                    
                }
            }else if(instance.service.type == "LIFX"){
                let url = `${instance.address}${command.path}`;
                if(command.body == null){
                    request({
                        uri: url,
                        method: command.method,
                        auth: {
                            bearer: instance.token
                        }
                    }, (err, res, body) =>{
                        if(err){
                            console.log(err);
                        }else{
                            console.log(body);
                        }
                    }); 
                    
                }else{
                    request({
                        uri: url,
                        method: command.method,
                        json: true,
                        body: command.body,
                        auth: {
                            bearer: instance.token
                        }
                    }, (err, res, body) =>{
                        if(err){
                            console.log(err);
                        }else{
                            console.log(body);
                        }
                    }); 
                    
                }
            }
            
            break;    
        default:
            break;
        }
}

onmessage = (e)=>{
   switch(e.data.event){
        case "start-instance":
            let workerResult = createBackEndInstance(e.data.instance, database, socket, diagnosticSocket, helperSocket, analyticsSocket);
            instances.push(workerResult.instance);
        break;
    case "write-to-instance":
        let instance = instances.find(runningInstance=>{
            return runningInstance.id == e.data.command.id;
        })
        writeToInstance(e.data.command, instance);
        break;
    case "restart-instance":
        instances = instances.filter(runningInstance=>{
            return e.data.id != runningInstance.id
        })            
        workerResult = createBackEndInstance(e.data, database, socket, diagnosticSocket, helperSocket, analyticsSocket);
        instances.push(workerResult.instance);
        break;
        case "delete-instance":
            instance = instances.find(runningInstance=>{
                return runningInstance.id == e.data.id;
            })
            instance.service.connection.end();
            instance.service.connection = null;
            instances = instances.filter(runningInstance=>{
                return runningInstance.id != e.data.id
            })
        break;
    }
    
}