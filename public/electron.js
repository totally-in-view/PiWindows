var net = require("net");
var fs = require("fs");
const process = require("process");
const {app, powerSaveBlocker, BrowserWindow, dialog, ipcMain, Menu, MenuItem} = require("electron");
const isDev = require("electron-is-dev");
const path = require('path')
const numOfProcesses = require("os").cpus().length;

let ThreadManager = require(path.join(__dirname, "ThreadManager.js"));
let threadManager = new ThreadManager([]);
var slash = process.platform == "darwin" ? "/" : "\\";
let db = null;
let diagnosticSocket = null;
let analyticsSocket = null;
let helperSocket = null;
let server;

try{
    db = isDev ? require(`better-sqlite3`)(`${app.getAppPath()}${slash}public${slash}ph-devices-table.db`, {timeout: 10000}) : require('better-sqlite3')(`${app.getAppPath()}${slash}build${slash}ph-devices-table.db`, {timeout: 10000});
    db.pragma("journal_mode = WAL")
    let user =  db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
    let adminSettings = db.prepare(`SELECT * FROM admin_settings WHERE id=1`).get();
    helperSocket = client(adminSettings.helper, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
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
}catch(err){

}


let { inspectInstance, convertVantage, DriverFactory, APIReader, importInstancesFromCSV, findStation, getStationBuses, exportReports, getStation, createTriggerReport, createAnalyticsReport, createAsBuiltReport, createNetworkReport, createBusReport, discoverPhillipsHue, discoverLIFX } = isDev ? require(`${app.getAppPath()}${slash}public${slash}PI`) :  require(`${app.getAppPath()}${slash}build${slash}PI`);
let { findDevice, bindingDevice, getDevicesFromDatabase }  = isDev ? require(`${app.getAppPath()}${slash}public${slash}PIFileHandler`) : require(`${app.getAppPath()}${slash}build${slash}PiFileHandler`) 
let { addDevicesToDB, addInstanceToDB, alterInstanceInDB, alterDeviceInDB, deleteInstanceFromDB, deleteDeviceFromDB } = isDev ? require(`${app.getAppPath()}${slash}public${slash}events${slash}db-events`) : require(`${app.getAppPath()}${slash}build${slash}events${slash}db-events`);
let { generateAsBuiltReport, generateGeneralReport, generateNetworkReport, generateBusReport, generateTriggerReport } = isDev ? require(`${app.getAppPath()}${slash}public${slash}events${slash}report-events`) : require(`${app.getAppPath()}${slash}build${slash}events${slash}report-events`);
let { getFile }  = require(path.join(__dirname, `Vantage.js`));
let {registerUser, login} = require(path.join(__dirname, "helper", "whmcs.js"));
let mainWindow,objectEditorWindow;

let isLocked = app.requestSingleInstanceLock();
let bgthreads = [];
let bgwindows = [];
/**
 * @function createWindow
 * @description Initializes BrowserWindow and Loads Frontend of client
 */
function createWindow() {
  mainWindow = new BrowserWindow({ 
      fullscreenable: true,
        icon: path.join(__dirname, "assets\\icons\\png\\icon.png") 
    })
    mainWindow.on("close", (event)=>{
        app.quit()
    })

    mainWindow.on("closed", ()=>{
    })
    mainWindow.loadURL( isDev ? 'http://localhost:3000/' : `file://${path.join(__dirname, `..${slash}build${slash}index.html`)}`);

  if(isDev){
    mainWindow.webContents.openDevTools();
  }
  
}
/**
 * @function createObjectEditorWindow
 * @description - Initializes BrowserWindow for Object Editor
 */
function createObjectEditorWindow(){
    objectEditorWindow = new BrowserWindow({
        fullscreenable: false,
        parent: mainWindow,
        webPreferences:{
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
           }
    })

    objectEditorWindow.loadURL(path.join(__dirname, "object-editor.html"));
    objectEditorWindow.webContents.openDevTools();

}
/**
 * @function createBackgroundWindows
 * @description - Initializes background threads.
 * @todo - Change hard coded 4 threads to dynamic threads using numOfProcesses variable. 
 */
function createBackgroundWindows(){
    for(let i = 0; i < numOfProcesses; i++){
        let win = isDev ?  new BrowserWindow({
           show: true,
           webPreferences:{
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
           }
        }) : new BrowserWindow({
            show: false,
            webPreferences:{
             nodeIntegration: true,
             nodeIntegrationInWorker: true,
            }
         }) 
        win.on("closed", ()=>{
        })
        win.loadURL(`file://${path.join(__dirname, `${slash}bg.html`)}`)
        win.webContents.openDevTools();
        bgwindows.push(win);
    }
}

/**
 * @function createBackEndInstance
 * @param {object} instance 
 * @param {Database} db 
 * @param {object} socket 
 * @description - Creates a live Backend Instance, depending on the service type. After creating the live instance, the data received is then logged and sent to the front end.
 * @deprecated - THIS FUNCTION IS DEPRECATED AS OF 0.10.0. It now lives under instance.js and run in separate threads
 */
function createBackEndInstance(instance, db, socket, diagnosticSocket, helperSocket, analyticsSocket){    
    let user = {
        clientId: 14,
        lastLogin: Date.now(),
        permission: "client"
    }
    // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
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
                status = "offline";
                socket.emit(`instance-${instance.id}-status`, status)
                socket.emit(`instance-status`, {instance: runtimeInstance, status: "offline"});
            });

            runtimeInstance.service.connection.on("data", async (buffer)=>{
                let date = new Date();
                let resArr = buffer.toString("utf8").replace(/"/g, "'").split("\r\n");
                status = "online";
                let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
                let fileJSON = JSON.parse(file);
                resArr.forEach((res)=>{
                    let response = convertVantage(res);
                    if(!response.includes("ERROR") && !response.includes("STATUS") && !response.includes("task")){
                        let resArray = response.split("_");
                        if(analyticsSocket != null){
                            analyticsSocket.emit("pi-device-status", {instanceId: instance.id, res: response}, user["clientId"]);
                        }else{
                            socket.emit(`${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, ...resArray.splice(2));
                        }
                    }
                    helperSocket.emit("instance-response", res, fileJSON.devices, instance, user["clientId"]);
                })
                // resArr.forEach((res)=>{
                //     if(res != ""){
                //     let response = convertVantage(res);
                //     let diagnosticLog;
                //     if(response != null){
                //         if(!response.includes("ERROR") && !response.includes("STATUS") && !response.includes("task")){
                //             let resArray = response.split("_");
                //             if(analyticsSocket != null){
                //                 analyticsSocket.emit("pi-device-status", {instanceId: instance.id, res: response}, user["clientId"]);
                //             }else{
                //                 socket.emit(`${instance.id}_${resArray[0].toLowerCase()}_${resArray[1]}_res`, ...resArray.splice(2));
                //             }
                //             let device;
                //             try{
                //                 let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
                //                 let fileJSON = JSON.parse(file);
                                
                //                 device = fileJSON.devices.find((value, index)=>{
                //                     return value.props.type.toLowerCase() == resArray[0] && value.props.id == resArray[1] && value.props.instanceId.id == instance.id
                //                 })
                //                 }catch(err){
                //                 }   
                //                 if(device != null){
                                    
                //                     if(device.props.type.toLowerCase().includes("hvac")){
                //                         diagnosticLog = `${device.props.name}: ${response.split("_")[3]}`
                //                     }else{
                //                         diagnosticLog = `${device.props.name}: ${response.split("_")[2]}`
                //                     }

                //                 }else{
                //                     diagnosticLog = response;
                //                 }
                //             }else if(response.includes("STATUS")){
                //                 diagnosticLog = `${instance.name}: Online!`
                //                 socket.emit(`instance-status`, {instance: instance, status: "online"})
                //             }
                //             else{
                //                 diagnosticLog = response;
                //             }
                //         }
                //         try{
                //             if(diagnosticLog != ""){
                //                 let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                //                 let diagnosticStatement = `INSERT INTO diagnostic_log_table (log, eventTime, instanceName, instanceId, clientId) VALUES ("${diagnosticLog}", ${date.getTime()}, "${instance.name}", "${instance.id}", ${user["clientId"]})`
                //                 diagnosticSocket.emit("update-diagnostic-log", diagnosticStatement, instance)
                //             }

                //             socket.emit(`instance-${instance.id}-status`, "online");
                //         }catch(err){
                //         }
                //     }
                // });
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

/**
 * @function writeToInstance
 * @param {string} command
 * @param {object} instance 
 * @param {Database} db
 * @description Writes information to live backend instance 
 * @deprecated - THIS FUNCTION IS DEPRECATED AS OF 0.10.0. It now lives under instance.js and run in separate threads
 */
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

/**
 * @function createDriverTables
 * @param {object} drivers 
 * @param {Database} database
 * @description Takes all drivers and creates tables for them in the database 
 */
function createDriverTables(drivers, database = null){
    drivers.forEach((driver)=>{
        var tableName;
        var columns = [];
        for(var prop in driver.props){
            if(prop == "type"){
                tableName = `${driver.props[prop].toLowerCase()}_table`
            } 
            else if(prop == "id"){
                columns.push(`${prop} PRIMARY_KEY`);
            }
            else if(prop == "area"){
                columns.push(`areaId INTEGER`);
            }
            else {
                if(typeof driver.props[prop] == "string"){
                    columns.push(`${prop} TEXT`);
                }
                else if(typeof driver.props[prop] == "number"){
                    columns.push(`${prop} INTEGER`)
                }
                else if(typeof driver.props[prop] == "boolean"){
                    columns.push(`${prop} INTEGER`);
                }
                else if(typeof driver.props[prop] == "object"){
                    for(var objectProp in driver.props[prop]){
                        if(typeof driver.props[prop][objectProp] == "string"){
                            columns.push(`${objectProp} TEXT`);
                        }
                        else if(typeof driver.props[prop][objectProp] == "number"){
                            columns.push(`${objectProp} INTEGER`)
                        }
                    }
                }
            }
        }

        var databaseString = `CREATE TABLE IF NOT EXISTS ${tableName} (`;

        for(var i = 0; i < columns.length; i++){
            var col = columns[i];
            if(i == columns.length-1){
                databaseString += `${col}`;
            }else{
                databaseString += `${col}, `;
            }
        }
        databaseString += `)`;
		try{
       		database.prepare(databaseString).run();
		}catch(err){
		};
		})
}

/**
 * @function insertDeviceIntoTable
 * @param {object} device 
 * @param {Database} database
 * @description Adds device into database 
 */
async function insertDeviceIntoTable(device, database = null){
    var table;
    var columns = [];
    var values = [];
    var colStatement = `(`;
    var valStatement = `(`;
    for(var prop in device.props){
        if(prop.includes("instanceId")){
            var instance = device.props.instanceId;
            addInstanceToInstanceTable(instance, database);
            columns.push("instanceId");
            // var val = database.prepare(`SELECT id FROM instance_table WHERE name = "${instance.name}"`).get()
            values.push(instance.id);
        }
        else if(typeof device.props[prop] == "object"){
            for(var objectProp in device.props[prop]){
                    values.push(device.props[prop][objectProp]);
                    columns.push(objectProp);
            }
        } else if(prop == "type"){
           table = `${device.props[prop].toLowerCase()}_table`
		} else if(prop == "area"){
            addAreaToAreaTable(device.props[prop], device.props.instanceId, database);
            columns.push("areaId");
            values.push(database.prepare(`SELECT id FROM area_table WHERE name = "${device.props[prop]}"`).get().id);
        }else if(prop == "id"){
            columns.push("id");
            values.push(device.props[prop]);
        } 
        else{
            if(typeof device.props[prop] == "string"){
                columns.push(prop);
                values.push(`"${device.props[prop]}"`);
            }
            else if(typeof device.props[prop] == "boolean"){
                columns.push(prop);
                if(device.props[prop] == true){
                    values.push(1);
                }else{
                    values.push(0);
                }
            }
            else if(prop == "color"){
                for(var objectProp in device.props[prop]){
                    if(typeof device.props[prop][objectProp] == "string"){
                        columns.push(`${objectProp}`);
                        values.push(`"${device.props[prop][objectProp]}"`)
                    }
                    else if(typeof device.props[prop][objectProp] == "number"){
                        columns.push(`${objectProp}`);
                        values.push(`${device.props[prop][objectProp]}`)
                    }
                }
            }
            else{
                columns.push(prop);   
                values.push(device.props[prop]);
            }
        }
        
    }

    for(var i = 0; i < columns.length; i++){
        if(i == columns.length -1){

            colStatement += `${columns[i]})`;
            if(values[i] === ""){
                valStatement += "empty)";
            }else{
                valStatement += `${values[i]})`
            }
        }
        else{
            colStatement += `${columns[i]}, `
            if(values[i] === ""){
                valStatement += "empty, "
            }else{
                valStatement += `${values[i]}, `
            }
    }
    
}
    var statement = `INSERT INTO ${table} ${colStatement} VALUES ${valStatement}`
    try{
        database.prepare(statement).run();
    }catch(err){
    }
    
}

/**
 * @function addAreaToAreaTable
 * @param {string} area 
 * @param {number} instanceId 
 * @param {Database} database
 * @description Adds area to database 
 */
function addAreaToAreaTable(area, instanceId, database){
    if(database.prepare(`SELECT * FROM area_table WHERE name = "${area}" AND instanceId = "${instanceId.id}"`).get() == null){
        var statement = `INSERT INTO area_table (name, instanceId) VALUES ("${area}", "${instanceId.id}")`;
        database.prepare(statement).run();
    }

}

/**
 * @function addInstanceToInstanceTable
 * @param {object} instance 
 * @param {Database} database 
 * @description Adds instance to database.
 */
function addInstanceToInstanceTable(instance, database){
    var res;
    
    try{
        res = database.prepare(`SELECT * FROM instance_table WHERE id = "${instance.id}"`).get();
    }catch(err){
    }
    if(res == null){
        try{
            database.prepare(`INSERT INTO instance_table (id, address, name, service, port) VALUES ("${instance.id}", "${instance.address}", "${instance.name}", "${instance.service}", ${parseInt(instance.port)})`).run();
        }catch(err){
        }
        
    }
}

function divideWork(threads, items){
    let roundround = require("roundround");

    let next = roundround(threads);
    for(let item of items){
        next().instances.push(item);
    }
    return threads
}

/**
 * @function formInstanceClusters
 * @param {Array<Instances>} instances 
 * @description - Round Robin strategy implemented to split work equally for Instance Processes
 * @todo - Fix multi-core issue
 */
function formInstanceClusters(bgthreads, instances){
    bgthreads = divideWork(bgthreads, instances)
    console.log(bgthreads)
    // let dividend = Math.floor(instances.length / (4 - 2));
    // let mod = instances.length % (4-2)
    // let difference = instances.length - 4
    // let instancesSplit = new Array(4-2);
    // if(dividend != 0){
    //     let j = 0;
    //     for(let i = 0; i <= instances.length; i+=dividend){
            
            
    //         try{
    //             let coreInstances = instances.slice(i, i+dividend);
    //             instancesSplit[j] = coreInstances;
    //         }catch(err){
    //             console.log(err);
    //         }
    //         j++;
    //     }
    //         if(mod != 0){
    //             try{
    //                 let leftovers = instances.slice(instances.length-dividend, instances.length)
    //                 instancesSplit[0] = instancesSplit[0].concat(...leftovers);
                    
    //             }catch(err){
    //                 console.log(err);
    //             }
    //         }    
    // }else{
    //     for(let i = 0; i < mod; i++){
    //         instancesSplit[i] = [instances[i]];
    //     }
    // }
    // for(let i = 0; i < instancesSplit.length; i++){
    //     try{
    //         if(instancesSplit[i] != null){
    //             bgthreads[i+2].instances = instancesSplit[i];
    //         }else{
    //         }
    //     }catch(err){
    //         console.log(err);
    //     }
    // }
    // if(difference > 0){
    //         for(let i = 2; i < numOfProcesses; i++){

    //             try{
    //                 if(bgthreads[i].instances.indexOf(instances[i-2]) < 0){
    //                     bgthreads[i].instances.push(instances[i-2])
    //                 }
                   
    //             }catch(err){
    //                 console.log(err)
    //             }
    //         }
    //     }else{
    //         let i = 2;
    //         let j = instances.length;
    //         let k = 0;
    //         while(k != j){
    //             try{
    //                 if(bgthreads[i] == null){
    //                     i = 1;
    //                 }else if(bgthreads[i].instances.indexOf(instances[k])){
    //                     bgthreads[i].instances.push(instances[k]);
    //                 }
    //             }catch(err){
    //                 console.log(err);
    //             }
                
                
    //             if(i == numOfProcesses){
    //                 i = 2;
    //             }else{
    //                 i++;  
    //             }
    //             k++;
    //         }
    //     }
        threadManager.updateThreads(bgthreads)
        threadManager.startProcesses();
    }

/**
 * @function sendCommandToinstanceWorker
 * @param {*} workers 
 * @param {*} instance 
 * @param {*} event 
 * @param {*} message 
 */
function sendCommandToInstanceWorker(workers,instance, event, message){
    let worker;
    for(let runningWorker of workers){
        if(Array.isArray(runningWorker.instances)){
            for(let workerInstance of runningWorker.instances){
                if(workerInstance != null){
                    if(workerInstance.id == instance.id){
                        worker = runningWorker
                    }
                }
                
            }
        }
    }
    // let worker = workers.find(workerProcess=>{
    //     if(!Array.isArray(workerProcess.instances)){
    //         return null;
    //     }
    //     try{
    //         return workerProcess.instances.findIndex(workerInstance =>{
    //             if(workerInstance == null){
    //                 return false
    //             }
    //             return workerInstance.id == instance.id}) > -1;
    //     }catch(err){
    //         console.log(workerProcess.instances)
    //     }finally{
    //         return null
    //     } 
        
    // })
    if(worker != null){
        worker.process.send(event, message);
    }
}

function removeInstanceFromCluster(workers, instance){
    for(let worker of workers){
        if(worker.instances.includes(instance.id)){
            worker.instances = worker.instances.filter(workerInstance=>{
                return workerInstance != instance.id
            })
        }
        sendCommandToInstanceWorker(workers, instance, "delete-instance", instance);
    }
}
/**
 * @function startInstanceLogs
 * @param {*} instances 
 * @param {*} db 
 * @param {*} socket 
 * @deprecated - THIS FUNCTION IS DEPRECATED AS OF 0.10.0
 */
function startInstanceLogs(instances, db, socket, diagnosticSocket, helperSocket, analyticsSocket){
    var instancesToReturn = []
    let inspection;
    for(const instance of instances){
        (async(instance)=>{
            inspection = inspectInstance(null,instance);
            socket.emit("inspection", {
                inspection: inspection}
                );
        })(instance)
        try{

            var backendInstance = createBackEndInstance(instance, db, socket, diagnosticSocket, helperSocket, analyticsSocket).instance;
            instancesToReturn.push(backendInstance)
        }catch(err){
            console.log(err);
        }
        
    }
    return instancesToReturn;
}
/**
 * @function restartInstance
 * @param {*} id 
 * @param {*} instances 
 * @param {*} db 
 * @param {*} socket 
 * @param {*} diagnosticSocket 
 * @param {*} analyticsSocket 
 * @deprecated - THIS FUNCTION IS DEPRECATED AS OF 0.10.0
 */
async function restartInstance(id, instances, db, socket, diagnosticSocket, analyticsSocket){
    let instancesToReturn = [];
    let instanceRestarted = {
        status: "offline"
    };
    for(let instance of instances){
        if(instance.id == id){
            instanceRestarted = createBackEndInstance(instance, db, socket, diagnosticSocket, analyticsSocket);
            instancesToReturn.push(instanceRestarted.instance);
        }
        else{
            instancesToReturn.push(instance);
        }
    }

    return {
        instances: instancesToReturn,
        status: instanceRestarted.status
    }
}
/**
 * @function closeInstanceLogs
 * @param {*} instances 
 * @deprecated - THIS FUNCTION IS DEPRECATED AS OF 0.10.0
 */
function closeInstanceLogs(instances){
    instances.forEach((instance)=>{
        try{
            instance.service.connection.end()
        }catch(err){

        }
        
    });
}
/**
 * @function alterDevice
 * @param {*} db 
 * @param {*} file 
 * @param {*} id 
 * @param {*} device 
 * @description This function updates the SQLite table with any new information for the device. 
 */
function alterDevice(db, file,id, device){
    let statement = `UPDATE ${device.props.type.toLowerCase()}_table SET `
    let alterations = [];

    var deviceIndex = file.devices.findIndex(fileDevice => {
        return fileDevice.props.id == id && fileDevice.props.instanceId.id == device.props.instanceId.id
    });
    let originalDevice = file.devices[deviceIndex];

    for(var prop in device.props){
        originalDevice.props[prop] = device.props[prop];
        if(prop.includes("instanceId")){
            var instance = device.props.instanceId;
            let val = `${prop} = `;
            var dbInstance = db.prepare(`SELECT id FROM instance_table WHERE name = "${instance.name}"`).get()
            val = `${val}${dbInstance.id}`;
            alterations.push(val);
        }
        else if(typeof device.props[prop] == "object"){
            for(var objectProp in device.props[prop]){
                    let val = `${objectProp} = `;
                    if(typeof(device.props[prop][objectProp]) == "string"){
                        val = `${val}"${device.props[prop][objectProp]}"`
                    }else{
                        val = `${val}"${device.props[prop][objectProp]}"`
                    }
                    alterations.push(val);
            }
        } else if(prop == "type"){
		} else if(prop == "area"){
            addAreaToAreaTable(device.props[prop], device.props.instanceId, db);
            let val = `areaId = `;
            let areaId = db.prepare(`SELECT id FROM area_table WHERE name = "${device.props[prop]}"`).get().id;
            val = `${val}${areaId}`;
            alterations.push(val);
        }else if(prop == "id"){
            let val = `id = ${device.props[prop]}`;
            alterations.push(val);
        } 
        else{
            if(typeof device.props[prop] == "string"){
                let val = `${prop} = "${device.props[prop]}"`;
                alterations.push(val);
            }
            else if(typeof device.props[prop] == "boolean"){
                let val = `${prop} = `;

                if(device.props[prop] == true){
                    val = `${val}${1}`
                }else{
                    val = `${val}${0}`;
                }
                alterations.push(val);
            }
            else if(prop == "color"){
                for(var objectProp in device.props[prop]){
                    if(typeof(device.props[prop][objectProp]) == "string"){
                        val = `${val}"${device.props[prop][objectProp]}"`
                    }else{
                        val = `${val}"${device.props[prop][objectProp]}"`
                    }
                    alterations.push(val);
                }
            }
        }
    }
    for(var i = 0; i < alterations.length; i++){
        if(i == alterations.length-1){
            statement += `${alterations[i]}`
        }else{
            statement += `${alterations[i]}, `
        }
    }
    statement = `${statement} WHERE id =${id} AND instanceId="${originalDevice.props.instanceId.id}"`;
    db.prepare(`${statement}`).run()
    file.devices[deviceIndex] = originalDevice
    return file
}

/**
 * @function alterInstance
 * @param {*} db 
 * @param {*} file 
 * @param {*} id 
 * @param {*} instance 
 * @description Alters Instance in SQLite Database
 */
function alterInstance(db, file, id, instance){
    let statement = `UPDATE instance_table SET `;
    let alterations = []

    var instanceIndex = file.instances.findIndex(fileInstance => {
        return fileInstance.id == id
    });

    file.instances[instanceIndex] = instance
    file.devices.forEach((device)=>{
        try{
            if(id == device.props.instanceId.id){
                device.instanceId = instance;
            }
        }catch(err){
        };
    })

    for(var prop in instance){
        let val = `${prop} = `;
        if(typeof(instance[prop]) == "string"){
            val = `${val}"${instance[prop]}"`;
        }else if(prop == "aliases"){

        }else if(typeof(instance[prop] == "object")){

        }
        else{
            val = `${val}${instance[prop]}`;
        }

        alterations.push(val)
    };

    for(var i = 0; i < alterations.length; i++){
        if(i == alterations.length-1){
            statement += `${alterations[i]}`
        }else{
            statement += `${alterations[i]}, `
        }
    }
    statement += ` WHERE id=${id}`
    try{
        db.prepare(statement).run();
        db.prepare(`UPDATE area_table SET instanceId="${instance.id}" WHERE instanceId="${id}"`).run();
    }catch(err){
    }
    return file
}

/**
 * @function deleteInstance
 * @param {*} db 
 * @param {*} file 
 * @param {*} drivers 
 * @param {*} id 
 * @description Deletes Instance from SQLite database
 */
async function deleteInstance(db, file, drivers, id){
    let fileInstances = file.instances;
    let fileDevices = file.devices;
    db.prepare(`DELETE FROM instance_table WHERE id = "${id}"`).run();
    db.prepare(`DELETE FROM area_table WHERE instanceId = "${id}"`).run();
    drivers.forEach((driver)=>{
        db.prepare(`DELETE FROM ${driver.props.type.toLowerCase()}_table WHERE instanceId = "${id}"`).run();
    });
    if(isDev){
        try{
            fs.unlinkSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${id}.json`);
        }catch(err){

        }
    }else{
        try{
            fs.unlinkSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${id}.json`);
        }catch(err){

        }   
    }
    
    let instances = fileInstances.filter( instance => {
        return instance.id != id
    });

    let devices = fileDevices.filter( device =>{ 
        return device.props.instanceId.id != id
    });
    return {
        instances: instances,
        devices: devices
    }
}

/**
 * @function deleteDevice
 * @param {*} db 
 * @param {*} file 
 * @param {*} type 
 * @param {*} id 
 * @param {*} instanceId 
 * @description Deletes device from SQLite Database
 */
function deleteDevice(db, file, type, id, instanceId){
    db.prepare(`DELETE FROM ${type.toLowerCase()}_table WHERE id = ${id} AND instanceId="${instanceId}"`).run();
    let devices =file.devices.filter(device => {
        return (device.props.type == type && device.props.id == id && device.props.instanceId.id != instanceId) || (device.props.id != id);
    });
    
    return {
        instances: file.instances,
        devices: devices
    }
}

/**
 * @function clearAllTables
 * @param {*} db 
 * @param {*} drivers 
 * @description Clears out databases from all information.
 */
async function clearAllTables(db, drivers){
    db.prepare("DELETE FROM area_table").run();
    db.prepare("DELETE FROM instance_table").run();

    drivers.forEach((driver)=>{
        db.prepare(`DROP TABLE IF EXISTS ${driver.props.type.toLowerCase()}_table`).run();
    });


}

/**
 * @function createDiagnosticTable
 * @param {*} device 
 * @param {*} diagnosticSocket 
 * @description Creates SQLite Query for Creation in Diagnostics Database
 */
function createDiagnosticTable(device, diagnosticSocket){
    let statement = `CREATE TABLE IF NOT EXISTS diagnostic_${device.type.toLowerCase().replace(/[-.]/g, "_")}_table (`;
    for(var prop in device){
            statement = `${statement} ${prop} TEXT, `
    }
    
    statement = statement.substring(0, statement.length-2);
    statement += ")";
    diagnosticSocket.emit("create-diagnostic-table", statement);
}

/**
 * @function insertDiagnosticDeviceIntoTable
 * @param {*} device 
 * @param {*} diagnosticSocket 
 * @description Creates SQLite Query for Insertion into Diagnostics Database
 */
function insertDiagnosticDeviceIntoTable(device, diagnosticSocket){
    let cols = "";
    let vals = "";
    for(var prop in device){
        if(typeof(device[prop]) == "object"){
            cols = `${cols}"${prop}", `;
            vals = `${vals}"${device[prop].toString()}", `;
        }else{
                cols = `${cols}"${prop}", `;
                vals = `${vals}"${device[prop]}", `
        }
    }
    cols = cols.substring(0, cols.length-2);
    vals = vals.substring(0, vals.length-2);
    let insertStatement = `INSERT INTO diagnostic_${device.type.replace(/[-.]/g, "_").toLowerCase()}_table (${cols}) VALUES (${vals})`;
    let typeStatement = `INSERT INTO diagnostic_device_types_table (deviceType) VALUES ("diagnostic_${device.type.replace(/[-.]/g, "_").toLowerCase()}_table")`;
    diagnosticSocket.emit("insert-into-diagnostic-table", {insert: insertStatement, type: typeStatement, device: device});
}

/**
 * @function diagnoseDevices
 * @param {*} instance 
 * @param {*} devicesFromDB 
 * @param {*} socket 
 * @param {*} database 
 * @param {*} analyticsSocket
 * @description Runs through Diagnostics Devices and gets the status of all devices. If there are devices that are offline, it will generate a ticket for support 
 * @todo Change conditional logic so  if there are offline devices, it pulls user data from database instead of a hard coded "Demo User"
 */
async function diagnoseDevices(instance, devicesFromDB, socket, database, analyticsSocket){
    let buses;
    let busArr = [];
    let devices = [];
    let offlineDevices = new Map();
    for await(let dbDevice of devicesFromDB){
        if(dbDevice.type.toLowerCase() == "master"){
            let inspectionInfo = instance.inspection.find(info=>{
                return info.masternumber == dbDevice.number
            })
            if(inspectionInfo != null){
                dbDevice = {...dbDevice, ...inspectionInfo};
                console.log(dbDevice);
            }
            try{
                buses = await getStationBuses(instance, dbDevice.number);
            }catch(err){
                console.log(err);
            }
            
            busArr.push({master: dbDevice.number, busXML: buses})
            try{
                for(var i = 0; i < instance.inspection.length; i++){
                    if(dbDevice.number == instance.inspection[i].masternumber){
                        dbDevice.serialnumber = instance.inspection[i].serialnumber
                        dbDevice.online = "true";    
                    }
                    console.log(dbDevice);
                }
            }catch(err){
                console.log(err);
            }
        }else if(dbDevice.serialnumber != null){
                let master = devicesFromDB.find(masterDevice=>{
                    return  dbDevice.master == masterDevice.id
                });

                if(master != null){
                    dbDevice.master = master.number
                }
                try{
                    let info = await getStation(instance, dbDevice.master, dbDevice.serialnumber);
                    dbDevice = {...dbDevice, ...info};
                }catch(err){
                    console.log(err)
                }
                
            }
        devices.push(dbDevice);
        socket.emit(`update-progress`, instance, devices.length, devicesFromDB.length);
    }

    devices.forEach((device)=>{
        if(device.parent != null){
            let parent = devices.find(parDev=>{
                return device.parent == parDev.id
            });

            try{
                if(device["online"] == null){
                    device["online"] = parent["online"];
                }
                if(device["area"] == null){
                    device["area"] = parent["area"];
                }
            }catch(err){
            }
        }
        if(device.up != null){
            let task = devices.find(taskDev=>{
                return device.up == taskDev.id
            });
    
            device["uptask"] = task 
        };

        if(device.hold != null){
            let task = devices.find(taskDev=>{
                return device.hold == taskDev.id
            });

            device["holdtask"] = task 
        };

        if(device.down != null){
            let task = devices.find(taskDev=>{
                return device.down == taskDev.id
            });

            device["downtask"] = task 
        };

        if(device.occupancytask != null){
            let task = devices.find(taskDev=>{
                return device.occupancytask == taskDev.id
            });

            device["occupancytask"] = task 
        };
        if(device.vacancytask != null){
            let task = devices.find(taskDev=>{
                return device.vacancytask == taskDev.id
            });

            device["vacancytask"] = task 
        };

        if(device.area != null){
            let area = devices.find(areaDev =>{
                return areaDev.id == device.area
            });
            try{
                device["area"] = area.name
            }catch(err){
            }
        }

        if(device.params != null){
            let params = [];
            let deviceParams = [];
            try{
                params = device.params.split(",");
                deviceParams = []
                params.forEach((param)=>{
                    let paramDev = devices.find(paramDevice=>{
                        return paramDevice.id == param
                    });

                    deviceParams.push(paramDev.name); 
                });

                device.params = deviceParams;
            }catch(err){

            }
        }

        if(device.eventObjects != null){
            try{
            let objects = [];
            device.eventObjects = device.eventObjects.split(",");
            device.eventObjects.forEach((eventObj)=>{
                let object = devices.find(eventDevice =>{
                    return eventDevice.id == eventObj
                })

                if(object.type == "Task"){
                    let params = object.params.split(",");
                    let deviceParams = []
                    params.forEach((param)=>{
                        let paramDev = devices.find(paramDevice=>{
                            return paramDevice.id == param
                        });

                        try{
                            deviceParams.push(paramDev.name); 
                        }catch(err){
                        }
                    });
                    objects = [...objects, ...deviceParams];
                    }else{
                        objects.push(object.name);
                    }
                })
            device.eventObjects = objects
            }catch(err){

            }   
        }
        if(device.serialnumber == "0"){
            device["commissioned"] = "false";
            device["online"] = null;
        }else if(device.serialnumber != "0" && device.serialnumber != null){
            device["commissioned"] = "true";
        }
    });
    if(isDev){
        fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`, JSON.stringify({devices: devices, busXML: busArr}));
    }else{
        fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`, JSON.stringify({devices: devices, busXML: busArr}));
    }
    devices.forEach((device)=>{
        if((device.online == "false" && device.serialnumber != null && device.serialnumber != "0" && !device.name.toLowerCase().includes("phantom"))){
            if(offlineDevices.has(device.type)){
                offlineDevices.set(device.type, [...offlineDevices.get(device.type), device]);
            }else{
                offlineDevices.set(device.type, [device]);
            }
        }
    })
    if(analyticsSocket != null){
        let client = database.prepare(`SELECT * FROM user_table WHERE id=1`).get();
        analyticsSocket.emit("set-analytics-devices", devices, user["clientId"]);
    }
    if(offlineDevices.size > 0){
        let message = generatePiTicket(offlineDevices, instance);
        let user = {
            clientId: 14,
            lastLogin: Date.now(),
            permission: "client"
        }
        // let user = database.prepare("SELECT * FROM user_table LIMIT 1").get();
        let size = 0;
        offlineDevices.forEach((value, key)=>{
            size += value.length;
        })
        let ticket = {
            subject: `${instance.name} - ${size} Devices Offline`,
            message: message,
            client: user.clientId
        };
        if(user.clientId != null){
            let request = require("request");
            request({
                method: "POST",
                uri: "http://www.portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
                form: {command: "OpenTicket", ticket: JSON.stringify(ticket)}
            }, (err, res, body)=>{

            })
        }
    }
    return devices;
}
/**
 * @function exportProject
 * @description Creates a compressed ZIP folder that stores your PI File, Your Manifest File and any Diagnostics Files for quick import.
 */
function exportProject(){
    let path = dialog.showSaveDialog({title: "Backup Project", defaultPath: "project.zip", filters: [{name:"Compressed Folder(.zip)", extensions: ["zip"]}]});
    let majorPath = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`;
    let files = [
        {
         name: `file.json`,
         content: fs.readFileSync(`${majorPath}file.json`) 
        },
        {
            name: `ph-manifest.json`,
            content: fs.readFileSync(`${majorPath}ph-manifest.json`)
        }
    ]

    let fileJSON = JSON.parse(files[0].content);

    fileJSON.instances.forEach((instance)=>{
        try{
            files.push({
                        name: `diagnosis_${instance.id}.json`,
                        content: fs.readFileSync(`${majorPath}diagnosis_${instance.id}.json`)
                    })
        }catch(err){
            
        }
    });

    let JSZip = require("jszip")
    let zip = new JSZip();
    for(const file of files){
        zip.file(file.name, file.content);
    }
    zip.generateNodeStream({type: "nodebuffer", streamFiles: true})
        .pipe(fs.createWriteStream(path))
}   

/**
 * @function importProject
 * @param {*} filePath 
 * @param {*} database 
 * @param {*} diagnosticSocket 
 * @description Imports a project into your application. This won't overwrite your current project, however it will add that project to whatever project you are working on
 */
function importProject(filePath, database, diagnosticSocket){
    let JSZip = require("jszip")
    let zip = fs.readFileSync(filePath);
    JSZip.loadAsync(zip).then((project)=>{
        let files = Object.keys(project.files);
        files.forEach(async (file)=>{
            let data = await project.file(file).async("string")
            if(!file.includes("db")){
                if(file.includes("ph-manifest.json")){
                    fs.writeFileSync(path.join(__dirname, "ph-manifest.json"), data)
                    let manifestObj = JSON.parse(data);
                        createDriverTables(manifestObj.drivers, database);
                    }
                    else if(file.includes("file")){
                        try{
                            let oldFile = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)) 
                            let fileJSON = JSON.parse(data);
                            let newFile = {
                                instances: [...oldFile.instances, ...fileJSON.instances],
                                devices: [...oldFile.devices, ...fileJSON.devices]
                            }
                            fs.writeFileSync(path.join(__dirname, "file.json"), JSON.stringify(newFile));
                            fileJSON.devices.forEach((device)=>{
                                insertDeviceIntoTable(device, database);
                            })
                        }catch(err){
                            console.log(err);
                        }
                    }else if(file.includes("diagnosis")){
                        fs.writeFileSync(path.join(__dirname, file), data);
                        let diagnosticDevices = JSON.parse(data).devices;
                        diagnosticDevices.forEach((device)=>{
                            try{
                                createDiagnosticTable(device, diagnosticSocket);
                                insertDiagnosticDeviceIntoTable(device, diagnosticSocket);
                            }catch(err){

                            }
                        });
                    }
                }
        })
            
        })
}
/**
 * @function generatePiTicket
 * @param {*} deviceMap 
 * @param {*} instance 
 * @description Takes all offline devices and generates the markup for the ticket that is sent to WHMCS
 */
function generatePiTicket(deviceMap, instance){
    let header = '#Pi Support\n'
    let subheader = '##Support for '+instance.name+' is requested\n'
    let body = '**Below are the devices that were discovered to be offline**\n'
    let tables = '';
    deviceMap.forEach((devices, type, map)=>{
        let tableHeading = '###'+type+'\n';
        let table = generateMarkdownTable(devices, instance)
        tables += tableHeading + table + '\n';
    });
    return  header + subheader + body + tables
}
/**
 * @function generateMarkdownTable
 * @param {*} devices 
 * @param {*} instance
 * @description Generates the Markdown table with devices in Ticket 
 */
function generateMarkdownTable(devices, instance){
    let tableBody = ``;
    devices.forEach((device, key, map)=>{
        tableBody += '| N/A | '+device.area+' | '+device.name+' | '+device.bustype + ' ' + device.bus +' | '+instance.name+' | ' + device.serialnumber + ' | ' + device.address + ' |\n';
    });

    let table = '| Building | Area | Device Name | Bus | Connected To | Serial Number | Address |\n'+
                '| -------- | ---- | ----------  | --- | ------------ | ------------- | ------- |\n'+
                tableBody;
    return table
}

/**
 * @function scheduleDiagnostics
 * @param {*} time 
 * @param {*} instance 
 * @param {*} devices 
 * @param {*} socket 
 * @param {*} database 
 * @param {*} analyticsSocket 
 * @description Creates Cron Job for Diagnostics. This automates reporting.
 */
function scheduleDiagnostics(time, instance, devices, socket, database, analyticsSocket){
    let schedule = require("node-schedule");
    let dailyJob;
    if(time.includes(":")){
        let timeArr = time.split(":");
        let hour = parseInt(timeArr[0]);
        let minute = parseInt(timeArr[1]);
        let chron = `${minute} ${hour} * * *`
        socket.emit("notify-event", `Diagnostics scheduled for ${hour}:${minute}`);
        try{
            dailyJob = schedule.scheduleJob(chron, async()=>{
                await diagnoseDevices(instance, devices, socket, database, analyticsSocket)
            });
        }catch(err){

        }
    }
    
    return dailyJob
}

/**
 * @function purgeDatabases
 * @param {*} database 
 * @desciption Removes all information from Databases/JSON files.
 * @todo Merge purgeDatabases with clearAllTables functions.
 */
function purgeDatabases(database){
    let scripts = database.prepare(`select 'drop table' || name || ';' from sqlite_master where type='table'`).all();
    scripts.forEach((script)=>{
        for(var prop in script){
            try{
                if(!script[prop].includes("area_table") || !script[prop].includes("instance_table") || !script[prop].includes("sqlite_sequence") || !script[prop].includes("user_table") || !script[prop].includes("admin_settings")){
                   database.prepare(script[prop]);
                }
            }catch(err){
            
            }
        }
    });
    try{
        database.prepare(`DELETE FROM area_table`);
        database.prepare(`DELETE FROM instance_table`);
        database.prepare(`DELETE FROM user_table`).run();
       
        
    }catch(err){
    }
    let fileJSON = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`));
    if(isDev){
        fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`, JSON.stringify({instances: [], devices: []}));
        fileJSON.instances.forEach((instance)=>{
            try{
                fs.unlinkSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`);
            }catch(err){

            }
        });    
    }else{
        fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}file.json`, JSON.stringify({instances: [], devices: []}));
        fileJSON.instances.forEach((instance)=>{
            try{
                fs.unlinkSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`);
            }catch(err){

            }
        });    
    }
}

if(!isLocked){
    if(!isDev){
        app.relaunch();
        app.quit();
    }
}
/**
 * @event app.on(ready)
 * @description Main Application Logic occurs here. Creates menu for app, sets up connection to Diagnostics and Analytics Databases and sets up main socket connection
 */
app.on('ready', ()=>{
    let client = require("socket.io-client");
    app.setAppUserModelId("com.pi.totallyinview");
    
    let menuTemplate = [
        {
            label: "Pinnacle Integrations",
            submenu:[
            {
                role:"close"
            },
            {
                role: "quit"
            }
        ]
    },
    {
        label: "File",
        submenu: [
            {
                label: "Open",
                accelerator: "CmdorCtrl+O"
            },
            {
                label: "Compare",
                accelerator: "CmdorCtrl+Shift+C"
            },
            {
                label: "Backup",
                accelerator: "CmdorCtrl+Shift+B",
                click () { exportProject()}
            },{
                label: "Import",
                accelerator: "CmdorCtrl+Shift+^",
                async click (){ 
                                let paths = dialog.showOpenDialog({title: "Import Project", filters: [{name: "Compressed Folder(.zip)", extensions: ["zip"]}]})
                                try{
                                    await importProject(paths[0], db, diagnosticSocket);
                                    server.sockets.emit("notify-event", "Project Imported! Please restart application");
                                }catch(err){
                                    console.log(err);
                                }
                            }
            }
        ]
    },
    {
        label: "Edit",
        submenu: [
            {role: "undo"},
            {role: "redo"},
            {role: "cut"},
            {role: "copy"},
            {role: "paste"},
            {role: "selectall"}
        ]
    },
    {
        label: "Maintenance",
        submenu: [
            {
                label: "Reload",
                accelerator: "CmdorCtrl+Shift+R",
                click () {
                    app.relaunch();
                    app.quit();
                }
            },
            {
                label: "Service Manager",
                click() {
                    server.sockets.emit("to-thread-manager")
                }
            },
            {
                label: "Update Systems",
                accelerator: "CmdorCtrl+Shift+U"
            },
            {
                label: "Database",
                accelerator: "CmdorCtrl+Shift+D"
            },
            {
                label: "Purge Logger",
                accelerator: "CmdorCtrl+Shift+P"
            },
            {
                label: "Object Editor",
                accelerator: "CmdorCtrl+Shift+O",
                click(){
                    createObjectEditorWindow();
                }
            },
            {
                label: "Instance Editor",
                accelerator: "CmdorCtrl+Shift+I"
            },
            {
                label: "Clean Database",
                click (){
                    purgeDatabases(db, diagnosticSocket)
                }
            },
            {
                label: "Update"
            },
            {
                label: "Whitelist",
                accelerator: "CmdorCtrl+Shift+W"
            },
            {
                label: "Ports",
                
            },
        ]
    },
    {
        label: "Help",
        submenu: [
            {
                label: "Version",
                click(){
                   server.sockets.emit("to-version")
                }
            },
            {
                label: "Client"
            },
            {
                label: "Server"
            },
            {
                label: "API"
            },
        ]
    }
]

let myAppMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(myAppMenu);
    createWindow();
    createBackgroundWindows();
    /**
     * @event ipcMain.on(ready)
     * @description Captures background threads for use. Automatically assigns first thread to diagnostics and the second thread to analytics
     */
    ipcMain.on("ready", (event, args)=>{
        let thread = {
            instances: [],
            process: event.sender,
            pid: args,
            mem: null
        }

        if(bgthreads.length == 0){
            thread.instances = "diagnostics"
        }else if(bgthreads.length == 1){
            thread.instances = "analytics"
        }
        bgthreads.push(thread)
        
        if(bgthreads.length == 4){
            threadManager = new ThreadManager(bgthreads);
        }
    })

    /**
     * @event ipcMain.on(process-info)
     * @description Collects the process info for a specific thread and updates info on threadManager
     */
    ipcMain.on("process-info", (event, {pid, mem})=>{
        let thread = bgthreads.find(bgthread=>{
            return bgthread.pid == pid;
        })

        thread.mem = mem;
        threadManager.updateThreadInfo(pid, thread);
    })
    let request = require("request");
    let io = require("socket.io");
    powerSaveBlocker.start("prevent-app-suspension");
    server = io.listen(3031);
    server.set("transports", ["websocket"]);
   
    
    let runtime = {
        instances: [],
        devices: [],
        schedules: {},
        jobs: {}
    }
    var map = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}map.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}map.json`));
    var manifest = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}ph-manifest.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`);
    var manifestObj = JSON.parse(manifest);
    try{
        createDriverTables(manifestObj.drivers, db);
    }catch(err){
    }
    try{
        let user =  db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
        let adminSettings = db.prepare(`SELECT * FROM admin_settings WHERE id=1`).get();
        helperSocket = client(adminSettings.helper, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
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
    }catch(err){

    }
    if(diagnosticSocket != null){
        diagnosticSocket.on("update-diagnostics", (instance)=>{
            let user = {
                clientId: 14,
                lastLogin: Date.now(),
                permission: "client"
            }
            diagnosticSocket.emit("get-diagnostics", user["clientId"]);
            diagnosticSocket.emit("log-request", instance)
        })
    }
    
    if(analyticsSocket != null){
        let user = {
            clientId: 14,
            lastLogin: Date.now(),
            permission: "client"
        }
        analyticsSocket.on("update-pi-graphs", (instance)=>{
            analyticsSocket.emit("get-pi-devices", instance, user["clientId"]);
        })
    }
    /**
     * @event server.on(connection)
     * @description Main Socket.IO Logic for Real Time Events
     */
	server.on("connection", (socket)=>{
        /**
         * @event socket.on(start-up)
         * @description Event that is triggered on start up. If user logged in 1 day ago, it will bypass login, else either go to the login page or the register page
         */
        socket.on("start-up", ()=>{
            // let user = { clientId: 14, lastLogin: Date.now(), permission: "client" }
            let user = db.prepare(`SELECT * from user_table WHERE id=1`).get();
            try{
                let date = new Date();
                date.setDate(date.getDate()-1)
                if(user ==  null){
                    socket.emit("to-register-page")
        
                }else if(user.lastLogin < date.getTime() || user.lastLogin == null){
                    socket.emit("to-login-page");
                }else{
                    let file = fs.readFileSync(path.join(__dirname, "file.json"));
                    let fileJSON = JSON.parse(file);
                    socket.emit("login-success", user);
                    socket.emit("file-requested", {instances: fileJSON.instances, devices: []});
                }
            }catch(err){
        
            }
        })
        /**
         * @event socket.on(file-request)
         * @description Event that is triggered on file request. Returns only the instances to the Frontend.
         */
        socket.on("file-request", ()=>{
            let file = fs.readFileSync(path.join(__dirname, "file.json"));
            let fileJSON = JSON.parse(file);
            socket.emit("file-requested", {instances: fileJSON.instances, devices: []});
        })

        /**
         * @event socket.on(start-log)
         * @description Starts control to instances when event is triggered. 
         * @todo Check and test threadManagement
         */
        socket.on("start-log", async ()=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)            
            let fileJSON = JSON.parse(file);
            formInstanceClusters(bgthreads, fileJSON.instances);
        })
        /**
         * @event socket.on(diagnostic-daily-job-req)
         * @description
         * @todo Check to see what this event is doing
         */
        socket.on("diagnostic-daily-job-req", (id)=>{
                try{
                    diagnosticSocket.emit("diagnostic-devices-req", id);            
                }catch(err){

                }
            })
        /**
         * @event socket.on(instances-request)
         * @description
         * @todo Check to see what this event is doing
         */
        socket.on("instances-request",()=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            socket.emit("instances", fileJSON.instances);
        });
        
        /**
         * @event socket.on(get-device-statuses)
         * @description Get statuses of all devices and send information to frontend
         */
        socket.on("get-device-statuses", async()=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let statuses = {
                online: 0,
                offline: 0
            }
            let diagnosis = {};
            for await(const instance of fileJSON.instances){
                let diagnosticDevices = [];
                try{
                    diagnosis = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${id}.json`));
                    diagnosticDevices = diagnosis.devices;
                }
                catch(err){

                }
                for await(const device of diagnosticDevices){
                    try{
                        if(device.online != null && device.serialnumber != null){
                            if(device.online.includes("true")){
                                statuses.online +=1;
                            }else if(device.online.includes("false")){
                                statuses.offline += 1;
                            }else{
                            }
                        }
                    }catch(err){
                    }
                }
            }
            socket.emit("device-statuses-update", statuses);
        })

        /**
         * @event socket.on(addDevicesToDB)
         * @description After parsing and collecting data for devices, add devices to databases for persistent use.
         */
        socket.on("addDevicesToDB", async(data)=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`;
            let {devicesArr, newFile}= await addDevicesToDB(data, fileJSON, db, manifestObj, diagnosticSocket, path);
            if(newFile!= null){
                if(isDev){
                    fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`, JSON.stringify(newFile));
                }else{
                    fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}file.json`, JSON.stringify(newFile))
                }
            }
            
            socket.emit("notify-event", `${devicesArr.length} devices added to system`);
            socket.emit("file-requested", {...newFile, devices: []});
        })
        /**
         * @event socket.on(get-devices)
         * @description Gets a small amout of devices from the JSON Database
         */
        socket.on("get-devices", (page)=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let devices = []
            if(page==null ){
                page = 1 
            }
            devices = fileJSON.devices.splice((page-1)*50, (page)*50);
            socket.emit("devices-returned", devices, fileJSON.devices.length);
        })
        /**
         * @event socket.on(map-request)
         * @description Returns the map that is used to read objects from the Instances
         */
        socket.on("map-request", ()=>{
            socket.emit("map-response", map)
        })

        /**
         * @event socket.on(diagnostics-request)
         * @description Requesting a certain page for Diagnostics Logs
         */
        socket.on("diagnostics-request", (limiter)=>{
            if(diagnosticSocket != null){
                let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                diagnosticSocket.emit("get-diagnostics", user["clientId"], limiter);
            }else{
            }
        });
        /**
         * @event socket.on(get-instance-devices-from-db)
         * @description Returning Devices from a specific instance and area.
         */
        socket.on("get-instance-devices-from-db", async(data, areaId)=>{
            let areas= [];
            if(areaId != null){
                try{
                    areas = db.prepare(`SELECT * FROM area_table WHERE instanceId="${data.id}" AND id=${areaId}`).all()
                }catch(err){
                    console.log(err);
                }
                }else{
                    try{
                        areas = db.prepare(`SELECT * FROM area_table WHERE instanceId="${data.id}"`).all();
                    }catch(err){
                    }
                }
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let devicesByArea = []
            let alias = data.alias;
            for await(const area of areas){
                var devices = await getDevicesFromDatabase(fileJSON.devices, area, alias);
                if(devices != null){
                    socket.emit(`getting-instance-${data.id}-devices`, devices)
                    devicesByArea.push(devices);
                }
                
            }

            socket.emit("getting-devices", devicesByArea);
        })
        /**
         * @event socket.on(restart-instance)
         * @description Restarts instance of a certain ID based on the thread
         */
        socket.on("restart-instance", async(id)=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let instance = fileJSON.instances.find(fileInstance=>{
                return fileInstance.id == id;
            })
            sendCommandToInstanceWorker(bgthreads, instance, "restart-instance", instance);
            // let res = restartInstance(id, fileJSON.instances, db, socket, diagnosticSocket, analyticsSocket)
            // runtime.instances = res.instances;
            // socket.emit(`instance-${id}-status`, res.status);
        })
        /**
         * @event socket.on(add-instance-to-db)
         * @description Adds instance from instance form to databases
         */
        socket.on("add-instance-to-db", async (instance)=>{
            let file = fs.readFileSync(path.join(__dirname, `file.json`)).toString();

            let fileJSON = JSON.parse(file);
            let newFile, inspection;
            try{
            let res = addInstanceToDB(instance, fileJSON, __dirname); 
            newFile = res.newFile;
            inspection = res.inspection
            let data = {
                instance: instance,
                db: db,
                socket: socket, 
                diagnosticSocket: diagnosticSocket,
                helperSocket: helperSocket,
                analyticsSocket: analyticsSocket
            }
            if(!isDev){
                app.relaunch();
                app.quit();
            }
             }catch(err){
                console.log(err)
            }
        })
        /**
         * @event socket.on(add-instances-to-db)
         * @description Adds multiple instances to Database based on CSV Import
         * @todo Fix CSV Functionality
         */
        socket.on("add-instances-to-db", async (instances)=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            closeInstanceLogs(runtime.instances);
            let newFile = await importInstancesFromCSV(instances, fileJSON);
            if(isDev){
                fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`, JSON.stringify(newFile));
            }else{
                fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}file.json`, JSON.stringify(newFile));
            }
            socket.emit("file-requested", {...newFile, devices: []});
            socket.emit("instances-added", newFile.instances);
            runtime.instances = await startInstanceLogs(newFile.instances, db, socket, diagnosticSocket, analyticsSocket);
        });
        /**
         * @event socket.on(get-drivers)
         * @description Gets the Drivers from Manifest File for Driver Designer creation
         */
		socket.on("get-drivers", ()=>{
			socket.emit("driversReturned", manifestObj.drivers);
		})

        /**
         * @event socket.on(generate-driver)
         * @description Generates Driver for Controls Usage
         */
		socket.on("generate-driver", (data)=>{
			var manifest = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`);
			manifestObj = JSON.parse(manifest);
			manifestObj.drivers.push(data);
            if(isDev){fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}ph-manifest.json`, JSON.stringify(manifestObj))}
            else{fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`, JSON.stringify(manifestObj))};
			servicesocketUsers[`${socket.nickname}`].emit("generate-driver", data);
		});
		
		/**
         * @event socket.on(ui-drivers-request)
         * @todo Figure out what this does
         */
		socket.on("ui-drivers-request", ()=>{
			var manifest = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`);
			var manifestObj = JSON.parse(manifest);
			if(isDev){fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}ph-manifest.json`, JSON.stringify(manifestObj))}
            else{fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`, JSON.stringify(manifestObj))};
			socket.emit("ui-drivers-response", manifestObj.drivers)
		})
		/**
         * @event socket.on(phoenix-api-call)
         * @description Takes api from front-end and generates actual request to go out to instance
         */
		socket.on("phoenix-api-call", (data)=>{
            try{
                let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            var apiCall = APIReader(data.cmd);
            var deviceIndex = runtime.devices.findIndex(device=>{
                return device.props.id == apiCall.id && device.props.type.toLowerCase() == apiCall.type && device.props.instanceId.id == data.instanceId.id
            });

            let instance = data.instanceId;
            // runtime.instances.forEach(runtimeinstance => {
            //     if(runtimeinstance.id == data.instanceId.id){
            //         instance = runtimeinstance
            //         let fiveMinutesFromNow = new Date();
            //         fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes()+5);
            //         runtime.schedules[instance.id] = fiveMinutesFromNow.getTime(); 
            //     };
            // })

            let phoenixDevice;
                if(deviceIndex == -1){
                    let device = findDevice(fileJSON.devices, apiCall.type, apiCall.id);
                    phoenixDevice = DriverFactory(device);
                    if(runtime.devices.length == 100){
                        runtime.devices.pop();
                    }
                    runtime.devices.push(phoenixDevice);
                }else{
                    phoenixDevice = runtime.devices[deviceIndex];
                }
            var command = phoenixDevice[apiCall.func](...apiCall.params);
            if(phoenixDevice.props.webService == "REST"){
                let method = command.method;
                delete command["method"];
                if(command == {}){
                    command = {
                        path: phoenixDevice.props.path,
                        method: method,
                        service: phoenixDevice.props.webService,
                        id: instance.id
                    }
                }else{
                    command = {
                        body: command,
                        path: phoenixDevice.props.path,
                        method: method,
                        service: phoenixDevice.props.webService,
                        id: instance.id
                    }
                }
                sendCommandToInstanceWorker(bgthreads, instance, "write-to-instance", command);
                // writeToInstance(command, instance);
            }else{
                command = {
                    body: command,
                    service: phoenixDevice.props.webService,
                    id: instance.id
                }
                sendCommandToInstanceWorker(bgthreads, instance, "write-to-instance", command);

                // writeToInstance(command, instance, db);   
            }
        }catch(err){
            console.log(err);
        }
    })
    /**
     * 
     */
    socket.on("terminal-command", (data)=>{
        let instance;

        runtime.instances.forEach((runtimeInstance)=>{
            if(runtimeInstance.id == data.instance.id){
                instance = runtimeInstance;
            }
        });
        if(instance != null){
            writeToInstance(data.command, instance, diagnosticSocket, socket);
        }
    })
	
    socket.on("create-template", (_template)=>{
        var template = React.createElement(
            "div",
            {
                onClick: ()=>{console.log("Clicked!")}
            },
        );
        var result = babel.transform(template, {
            code: true,
            presets: ["@babel/preset-react"]
        });
    })
    
    socket.on("get-file", async (data)=>{
        if(data.service == "REST"){
            var options = {
                "method": "",
                "hostname": data.address,
                "path": `/${data.path}`,
                "headers": {
                    ...data.header,
                    "cache-control": "no-cache",
                }
                };

                if(data["token-type"] == "bear"){
                    options["headers"] = {
                        ...options["headers"],
                        "authorization": `bearer ${data.token}`
                    }
                }
                else if(data["token-type"] == "path"){
                    options.path += `/${data.token}`
                }
                data.paths.forEach((path)=>{
                    options.path += `/${path}`
                })
        }else if(data.service == "Telnet"){
            var Telnet = require("telnet-client");
            var telsocket = new Telnet();
            
            var params = {
                host: data.address,
                port: 2001
            }
            await getFile("Project.dc", telsocket, params, socket, data );
        }

    });
//toast
		socket.on("download-file", async (instance)=>{
            if(instance.service == "Telnet"){
                socket.emit("notify-event", `Downloading file for ${instance.name}`);
                let Telnet = require("telnet-client");
                var telsocket = new Telnet();
                let port = instance.port;
                if(instance.port == 3001){
                    port = 2001
                }
                var params = {
                    host: instance.address,
                    port: port,
                    sendTimeout: 60000, 
                    maxBufferLength: 1000000000000000
                }
                await getFile("Project.dc", telsocket, params, socket, instance);  
            }else if(instance.service == "PhillipsHue"){
                await discoverPhillipsHue(instance, socket);
            }else if(instance.service == "LIFX"){
                await(discoverLIFX(instance, socket));
            }
            })
		  socket.on("command", async (command)=>{
			var telsocket = new Telnet();
			telsocket.connect({
				host: command.ip,
				port: 3001
			});
			telsocket.on("error", (err)=>{
				socket.emit("unhealthy", command.ip);
			});
	  
			telsocket.on("connect", ()=>{
				telsocket.send(command.cmd, (err, res)=>{
					if(err){
						socket.emit("command-response", err);
					}
					else{
						socket.emit("command-response", res);
					}
				})
			})
		  })
	  
		  socket.on("reboot", (data)=>{
            let telsocket = new Telnet();
			let params = {
			  host: data.address,
			  port: 2001
			}
			telsocket.connect(params);
	  
			telsocket.on("error", (err)=>{
			})
	  
			telsocket.on("connect", ()=>{
			  telsocket.send("<IConfiguration><Reboot><call>false</call></Reboot></IConfiguration>");
			})
            socket.emit("update-log", {log: "Rebooted!", instance: data});
        });
        

        socket.on("update-network", ()=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            for(const instance of fileJSON.instances){
                (async(instance)=>{
                    let inspection = await inspectInstance(null, instance);
                    socket.emit("inspection", {
                        inspection: inspection}
                        );
                })(instance)
            }
            socket.emit("notify-event", `Updating Network! ${fileJSON.instances.length} Networks are being updated!`)
        })
		  socket.on("status", (data)=>{
			var netsocket = net.createConnection(3001, data.ip, ()=>{
	  
			})
            var TelnetSocket = require("telnet-stream").TelnetSocket
			var telstream = new TelnetSocket(netsocket);
	  
			telstream.on("data", (data)=>{
			    socket.emit("status-read", data.toString("utf8"));
			})
			telstream.write("STATUS ALL\r\n");
		  });
		
		socket.on("update-template", ()=>{
			socket.emit("updating-template");
		})

        socket.on("diagnosis", (instance)=>{
            diagnosticSocket.emit("get-diagnostic-devices", instance);            
        })

        socket.on("get-diagnostics", (instance)=>{
            let diagnosis;
            try{
                diagnosis = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`))
                socket.emit("diagnostic-response", diagnosis);
            }catch(err){

            }
        })

        socket.on("update-station-status", async (data)=>{
            let {device, instance} = data;
            device["online"] = await findStation(instance, device.master, device.serialnumber);  
            if(analyticsSocket != null){
                let user = {
                    clientId: 14,
                    lastLogin: Date.now(),
                    permission: "client"
                }
                // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                analyticsSocket.emit("update-diagnostic-device", device, user["clientId"])    
            }
            let diagnosis = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)) : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`))
            let deviceCount = 0;
            let devices = diagnosis.devices;
            let deviceStatuses = {
                online: 0,
                offline: 0
            }
            for(var i = 0; i < devices.length; i++){
                let jsonDevice = devices[i];
                if(jsonDevice.type == device.type && jsonDevice.id == device.id){
                    devices[i] = device;
                    deviceCount++;
                }else if(jsonDevice.parenttype == device.type && jsonDevice.parent == device.id){
                    devices[i]["online"] = device["online"]
                    deviceCount++;
                }else if(jsonDevice.bustype == device.type && jsonDevice.bus == device.id){
                    devices[i]["online"] = device["online"]
                    deviceCount++;
                }
                if(devices[i].online != null && devices[i].serialnumber != null){
                    if(devices[i].online.includes("true")){
                        deviceStatuses.online++;
                    }else{
                        deviceStatuses.offline++;
                    }
                }    
            };
            if(isDev){
                fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`, JSON.stringify({...diagnosis, devices: devices}));
            }else{
                fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`, JSON.stringify({...diagnosis, devices: devices}));
            }
            let message = device["online"].includes("true") ? `${deviceCount} connected objects now online` : `${deviceCount} connected objects now offline`
            socket.emit("notify-event", `${device.type} ${device.name}: ${message}`)
            socket.emit("device-statuses-update", deviceStatuses);
            socket.emit("diagnostic-response", {...diagnosis, devices: devices});
        });

        socket.on("admin-mode", ()=>{
            mainWindow.webContents.openDevTools();
            socket.emit("settings-returned", app.getAppPath());
            socket.emit("settings-returned", db);
        });
        
        
        socket.on("create-device", (device)=>{
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let boundDevice = bindingDevice(device, manifestObj.drivers);
            try{
                insertDeviceIntoTable(boundDevice, db);
            }catch(err){
            }
            fileJSON.devices.push(boundDevice);
            if(isDev){
                fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`, JSON.stringify(fileJSON));
            }else{
                fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}file.json`, JSON.stringify(fileJSON));
            }
            socket.emit("file-requested", {...fileJSON, devices: []});
        });

        socket.on("alter-instance", async(alterations)=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let fileJSON = await alterInstanceInDB(alterations, db, path);
            socket.emit("file-requested", {...fileJSON, devices: []});
        });

        socket.on("alter-device", async (alterations)=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let fileJSON = await alterDeviceInDB(alterations, db, path);
            socket.emit("file-requested", {...fileJSON, devices: []});
        });

        socket.on("delete-instance", async (id)=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`;
            let newFileJSON = await deleteInstanceFromDB(id, db, manifestObj, path);
            diagnosticSocket.emit("clear-db", id);
            socket.emit("file-requested",  {...newFileJSON, devices: []})
            removeInstanceFromCluster(bgthreads, {id: id}, "delete-instance", {id: id});
            // startInstanceLogs(newFileJSON.instances, db, socket, diagnosticSocket, analyticsSocket);
        });
        

        socket.on("delete-device", async (device)=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`;
            let fileJSON = await deleteDeviceFromDB(device, db, path);
            socket.emit("file-requested",  {...fileJSON, devices: []})
        })
        
        socket.on("get-devices", ()=>{
            var drivers = manifestObj.drivers;
            for(const driver of drivers){
                let table = `${driver.props.type.toLowerCase()}_table`
                let statement = `SELECT ${table}.name, areaId, ${table}.id, instanceId, ${table}.widget FROM ${table} LEFT JOIN area_table ON area_table.Id =  ${table}.areaId`
            }
        })

        socket.on("save-event", (event)=>{
            var dateString = "";
            var actionString = "";
            var timeStart = event.startTime;
            var timeEnd = event.endTime;
            for(var i = 0; i < event.days.length; i++){
                if(i == event.days.length-1){
                    dateString += `${event.days[i]}`;
                }else{
                    dateString +=`${event.days[i]}, `;
                }
            }
            for(var i = 0; i < event.actions.length; i++){
                if(i == event.actions.length-1){
                    actionString += `${event.actions[i]}`;
                }else{
                    actionString += `${event.actions[i]}, `
                }
            }
            db.prepare(`INSERT INTO events_table (name, dates, actions, startTime, endTime, tagColor, type) VALUES ("${event.name}", "${dateString}", "${actionString}", "${timeStart}", "${timeEnd}", "${event.tag}", "${event.type}")`).run();
            manifestObj.drivers.forEach((driver)=>{
                if(driver.props.type == "VantageScene"){
                   
                }
            })
            
        })
        
		socket.on("close", ()=>{
            closeInstanceLogs(runtime.instances);
        });
        
        socket.on("download-report", async (reportType)=>{
            let savePath = dialog.showSaveDialog({title: "Save Report As", defaultPath: "report.xlsx", filters: [{name: "Excel Spreadsheet(.xlsx)", extensions: ["xlsx"]}]});
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            switch(reportType){
                case "network":
                    if(savePath != undefined){
                        try{
                            let networkReport = await generateNetworkReport(path);
                            createNetworkReport(networkReport, savePath);
                        }catch(err){
                            console.log(err);
                        }
                        
                    }
                    break;
                case "bus":
                    if(savePath != undefined){
                        let busReport = await generateBusReport(path);
                        createBusReport(busReport, savePath);
                    }
                    break
                case "as-built":
                    if(savePath != undefined){
                        try{
                            let report = await generateAsBuiltReport(path);
                            createAsBuiltReport(report, savePath)
                        }catch(err){
                            console.log(err);
                        }
                    }
                    break;
                default: 
                    if(savePath != undefined){
                        let report = await generateGeneralReport(path);
                        exportReports(report, savePath)   
                    };
                }

        });

        socket.on("trigger-report", async ()=>{
            let savePath = dialog.showSaveDialog({title: "Save Report As", defaultPath: "trigger-report.xlsx", filters: [{name: "Excel Spreadsheet(.xlsx)", extensions: ["xlsx"]}]});
            if(savePath != undefined){
                let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
                let fileJSON = JSON.parse(file);
                let report = []
                for(const instance of fileJSON.instances){
                    let diagnosticDevices = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)).devices : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)).devices;
                    report = [...report, ...diagnosticDevices];
                }
                try{    
                    createTriggerReport(report, fileJSON.instances, savePath); 
                }catch(err){
                    console.log(err);
                }
                  
            }
        })

        socket.on("asBuilt-report", async ()=>{
            let savePath = dialog.showSaveDialog({title: "Save Report As", defaultPath: "as-built.xlsx", filters: [{name: "Excel Spreadsheet(.xlsx)", extensions: ["xlsx"]}]});
            if(savePath != undefined){
                let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
                try{
                    let report = await generateAsBuiltReport(path);
                    createAsBuiltReport(report, savePath)
                }catch(err){
                    console.log(err);
                }
                
            }
        })
        socket.on("get-diagnostics-report", async ()=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let report = await generateGeneralReport(path);
            socket.emit("report-return", report);
        });

        socket.on("get-as-built-report", async()=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let report = await generateAsBuiltReport(path);
            socket.emit("report-return", report);
        })
        socket.on("get-network-report", async ()=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let networkReport = await generateNetworkReport(path);
            socket.emit("report-return", networkReport)
        })

        socket.on("get-bus-report", async ()=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let busReport = await generateBusReport(path);
            socket.emit("report-return", busReport);
        })

        socket.on("get-trigger-report", async ()=>{
            let path = isDev ? `${app.getAppPath()}${slash}public${slash}` : `${app.getAppPath()}${slash}build${slash}`
            let triggerReport = await generateTriggerReport(path);
            socket.emit("report-return", triggerReport);
        })
        socket.on("inspect-instance", async (instance, master=null)=>{
            try{
                let inspection = await inspectInstance(master, instance);
                socket.emit("notify-event", `Instance Inspected: Processor ${master}`)
                socket.emit("inspection", {inspection: inspection});
            }catch(err){
                if(isDev){
                    console.log(err);
                }
            }
            
        })
        socket.on("instances-inspected", (file)=>{
            let newFile = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`);
            let newFileJSON = JSON.parse(newFile);
            newFileJSON = {...newFileJSON, instances: file.instances};
            if(isDev){
                fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`,JSON.stringify(newFileJSON))
            }else{
                fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}file.json`,JSON.stringify(newFileJSON))
            }

            socket.emit('file-updated', file);
        });

        socket.on("get-areas", async (instance, alias=null, limiter=1)=>{
            let areas= [];
            let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`)
            let fileJSON = JSON.parse(file);
            let statement = `SELECT * FROM area_table WHERE instanceId="${instance.id}" LIMIT 12`
            if(limiter > 1){
                statement = `${statement} OFFSET ${(limiter-1)*12}`
            }
            let instanceAreas = db.prepare(statement).all();
            let numberOfAreas = db.prepare(`SELECT * FROM area_table WHERE instanceId="${instance.id}"`).all().length
            try{
                for(let area of instanceAreas){
                    area.instanceName = instance.name;
                    area.instanceAlias = alias;
                    area.thermostats = [];
                    area.lights = [];
                    area.scenes = [];
                    area.shades = [];
                    area.colorLights = [];
                    let areaDevicesTab = await getDevicesFromDatabase(fileJSON.devices, area, alias)
                    if(areaDevicesTab != null){
                        let areaDevices = areaDevicesTab.devices;
                        areaDevices.forEach((devices)=>{
                            if(devices[0] == "Light"){
                                area.lights = devices[1];
                            }else if(devices[0] == "Thermostat"){
                                area.thermostats = devices[1];
                            }
                            else if(devices[0] == "Shade"){
                                area.shades = devices[1]
                            }
                            else if(devices[0] == "Scene"){
                                area.scenes = devices[1]
                            }else if(devices[0] == "Color Light"){
                                area.colorLights = devices[1];
                            }
                        })     
                    }
                    if(area.thermostats.length != 0 || area.lights.length != 0 || area.scenes.length != 0 || area.shades.length != 0 || area.colorLights.length != 0){
                        areas.push(area);
                    }
                }
                
            }catch(err){
            }
            socket.emit("areas-returned", areas, numberOfAreas);
        })

        socket.on("get-pi-devices", (instance)=>{
            if(analyticsSocket != null){
                let user = {
                    clientId: 14,
                    lastLogin: Date.now(),
                    permission: "client"
                }
                // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                analyticsSocket.emit("get-pi-devices", instance, user["clientId"]);
            }
        });

        socket.on("get-logs", (instance)=>{
            diagnosticSocket.emit("log-request", instance)
        })

        socket.on("filter-log", (searchWord, filterBy)=>{
            if(filterBy.toLowerCase() == "instance"){
                searchWord = db.prepare(`SELECT id FROM instance_table WHERE name="${searchWord}"`).get().id;
            }
            diagnosticSocket.emit("filter-log", searchWord, filterBy)
        });
        socket.on("register-user", (info)=>{
            request({
                method: "POST",
                uri: "http://www.portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
                form: {command: "AddClient", registrationInfo: JSON.stringify(info)}
            }, (err, res, body)=>{
                let response = JSON.parse(body);
                if(response.result == "success"){
                    db.prepare(`INSERT INTO user_table (clientId, firstname, lastname, permission) VALUES (${response.clientid}, "${info.firstname}", "${info.lastname}", "client")`).run();
                    socket.emit("to-login-page");
                }else{
                    socket.emit("register-error", response.message)
                }
            })
        })

        socket.on("login", async (info)=>{

            let user = await login(info);
            if(user.err){
                console.log(user)
            }else{
                try{
                    let dbUser = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();

                    if(dbUser == null){
                        db.prepare(`INSERT INTO user_table (clientId, permission, lastLogin, id) VALUES (${user.clientId}, "client", ${Date.now()}, 1)`).run();
                    }else{
                        db.prepare(`UPDATE user_table SET lastLogin = ${Date.now()}, clientId=${user.clientId} WHERE id=1`).run();
                    }
                }catch(err){
                    console.log(err)
                }
                if(!isDev){
                    app.relaunch();
                    app.quit();
                }
                socket.emit("login-success", user);
            }
            // request({
            //     method: "POST",
            //     uri: "http://www.portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
            //     form: {command: "ValidateLogin", client: JSON.stringify(info)}
            // }, (err, res, body)=>{
            //     if(err){
            //         console.log(err);
            //         socket.emit("notify-event", err.Error);
            //     }else{
            //         if(body != undefined){
            //             let response = JSON.parse(body);
            //             if(response.result == "success"){
            //                 try{
            //                     db.prepare(`UPDATE user_table SET lastLogin = ${Date.now()}, clientId=${response.userid} WHERE id=1`).run();
            //                 }catch(err){
            //                     console.log(err);
            //                 }
            //                 let user = {
            //                     clientId: 14,
            //                     lastLogin: Date.now(),
            //                     permission: "client"
            //                 }
            //                 // try{
            //                 //     user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
            //                 // }catch(err){
            //                 // }
            //                 // if(user == null){
            //                 //     try{
            //                 //         db.prepare(`INSERT INTO user_table (clientId, permission, lastLogin, id) VALUES (${response.userid}, "client", ${Date.now()}, 1)`).run();
        
            //                 //     }catch(err){
            //                 //     }
            //                 //     user = db.prepare(`SELECT * FROM user_table WHERE clientId=${response.userid}`).get();
            //                 //     if(!isDev){
            //                 //         app.relaunch();
            //                 //         app.quit();
            //                 //     }
                                
            //                 //     socket.emit("login-success", user);
            //                 // }else{
            //                     socket.emit("login-success", user);
            //                 // }
            //                 try{
            //                     let adminSettings = db.prepare(`SELECT * FROM admin_settings WHERE id=1`).get();
            //                     helperSocket = client(adminSettings.helper, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
            //                     if(user.permission == "client"){
            //                         diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
            //                     }else if(user.permission == "analytics"){
            //                         diagnosticSocket = client(adminSettings.diagnostics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade:false, forceNew: false});
            //                         analyticsSocket = client(adminSettings.analytics, {timeout: 360000, pingTimeout: 360000, transports: ["websocket"], upgrade: false, forceNew: false});
            //                     }
            //                 }catch(err){
            //                 }
            //             }else{
            //                 socket.emit("login-error", response.message);
            //             }
            //         }
            //     }
                
            // })
    
        })

        socket.on("reset-password", (resetInfo)=>{
            request({
                method: "POST",
                uri: "http://www.portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
                form: {command: "ResetPassword", resetInfo: JSON.stringify(resetInfo)}
            }, (err, res, body)=>{
                if(err){
                    socket.emit("reset-password-error", err)
                }else{
                    let response = JSON.parse(body);
                    if(response.result == "error"){
                        socket.emit("reset-password-error", response.message);
                    }else{
                        socket.emit("reset-password-success", "A link to reset your password has been sent to your email");
                    }
                }
            })
        })

        socket.on("change-user-settings", (clientId, settings)=>{
            let statement = `CREATE TABLE IF NOT EXISTS user_${clientId}_settings (id INTEGER PRIMARY KEY, diagnosticTimes TEXT)`;
            if(clientId != null){
                try{
                    db.prepare(statement).run();
                }catch(err){
                    console.log(err);
                }
                let row;
                try{
                    row = db.prepare(`SELECT * FROM user_${clientId}_settings WHERE id=1`).get();
                }catch(err){
                    console.log(err)
                }
                if(row == null){
                    try{
                        db.prepare(`INSERT INTO user_${clientId}_settings (diagnosticTimes) VALUES ("${settings.toString()}")`).run();
                    }catch(err){
                        console.log(err)
                    }
                    
                }else{
                    try{
                        db.prepare(`UPDATE user_${clientId}_settings SET diagnosticTimes= "${settings.toString()}" WHERE id=1`).run();
                    }catch(err){
                        console.log(err)
                    }
                }
                if(!isDev){
                    app.relaunch();
                    app.quit();
                }
                
            }
        })

        socket.on("get-user-settings", (clientId)=>{
            let statement = `SELECT * FROM user_${clientId}_settings`
            let times = [];
            try{
                times = db.prepare(statement).get().diagnosticTimes.split(",")
            }catch(err){

            }

            socket.emit("user-settings", times)
        })

        socket.on("change-admin-settings", (diagnostics, analytics )=>{
            db.prepare(`UPDATE admin_settings SET diagnostics="${diagnostics}", analytics="${analytics}" WHERE id=1`).run()
            app.relaunch();
            app.quit();
        })

        socket.on("get-admin-settings", ()=>{
            let settings = db.prepare(`SELECT * FROM admin_settings WHERE id=1`).get();
            socket.emit(`admin-settings`, settings);
        })
        socket.on("get-light-color", (light)=>{
            if(analyticsSocket != null){
                let user = {
                    clientId: 14,
                    lastLogin: Date.now(),
                    permission: "client"
                }
                // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                analyticsSocket.emit("light-color-request", light, user["clientId"])
            }
        });
        
        socket.on("get-network-devices", (instance)=>{
            let diagnosticDevices = isDev? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${instance.id}.json`)).devices : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${instance.id}.json`)).devices;
            let devices = diagnosticDevices.filter((device)=>{
                return device.serialnumber != null
            })
            if(analyticsSocket != null){
                let user = {
                    clientId: 14,
                    lastLogin: Date.now(),
                    permission: "client"
                }
                // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                analyticsSocket.emit("get-donut-network-data", instance, user["clientId"]);
                analyticsSocket.emit("get-bar-network-data", instance, user["clientId"])
            }
            
            socket.emit("network-devices-return", devices)
        })
        socket.on("device-offline", (device)=>{
            let diagnosticDevices = [];
            try{
                diagnosticDevices = isDev ? JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${device.instanceId.id}.json`)).devices : JSON.parse(fs.readFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${devoce.instanceId.id}.json`));
                diagnosticDevices = diagnosticDevices.devices
            }catch(err){
                console.log(err);
            }finally{
                if(diagnosticDevices == null){
                    diagnosticDevices = []
                }
            }
            for(let diagnosticDevice of diagnosticDevices){
                if(diagnosticDevice.type == device.type && diagnosticDevice.id == device.id){
                    diagnosticDevice.online = "false";
                    if(diagnosticDevice.serialnumber == null){
                        diagnosticDevice.serialnumber = "N/A"
                    }
                    diagnosticSocket.emit("update-diagnostic-device", diagnosticDevice);
                }
            }
            try{
                if(diagnosticDevices.length != 0){
                    if(isDev){
                        fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}diagnosis_${device.instanceId}.json`, JSON.stringify(diagnosticDevices));
                    }else{
                        fs.writeFileSync(`${app.getAppPath()}${slash}build${slash}diagnosis_${device.instanceId}.json`, JSON.stringify(diagnosticDevices));
                    }
                }
            }catch(err){

            }
            
        });

        socket.on("filter-network-devices", (instance, filter)=>{
            if(analyticsSocket != null){
                let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                analyticsSocket.emit("filter-network-devices", instance, filter, user["clientId"]);
            }
        })

        socket.on("get-version-number", ()=>{
            socket.emit("version-number", app.getVersion());
        })

        socket.on("get-thread-manager", ()=>{
            let threads = []
            for(let thread of threadManager.threads){
                threads.push({
                    pid: thread.pid,
                    mem: thread.mem,
                    instances: thread.instances
                })
            }
            socket.emit('thread-manager-returned', threads)
        })

        socket.on("refresh-thread", (pid)=>{
            threadManager.refreshProcess(pid);
            let threads = []
            for(let thread of threadManager.threads){
                threads.push({
                    pid: thread.pid,
                    mem: thread.mem,
                    instances: thread.instances
                })
            }
            socket.emit("thread-manager-returned", threads);
        })
        socket.on("helper-passed-event", (event, data)=>{
            if(event.includes("status") && event.includes("instance")){
                server.sockets.emit(event, data)
            }else{
                server.sockets.emit(event, ...data)
            }
            
        })
        if(analyticsSocket != null){
            
            analyticsSocket.on("network-devices-filtered", (devices)=>{
                
                socket.emit("network-devices-line-data", devices)
            });
    
            analyticsSocket.on("donut-data-return", (data)=>{
               socket.emit("network-devices-doughnut-data", data)
            })
    
            analyticsSocket.on("bar-network-data", (data)=>{
                socket.emit("network-devices-bar-data", data);
            })
            analyticsSocket.on(`light-color-res`, (light, color)=>{
                socket.emit(`${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_color`, color);
            });
            analyticsSocket.on("pi-device-response", (event, response)=>{
                socket.emit(event, ...response);
            })
            analyticsSocket.on("pi-devices-response", (data)=>{
                socket.emit("pi-devices-response", data);
            })
        }
        if(diagnosticSocket != null){
            diagnosticSocket.on("diagnostics-response", (logs)=>{
               socket.emit("diagnostics-response", logs);
            });
    
            diagnosticSocket.on("diagnostic-devices-response", async (instance, devices)=>{
                socket.emit("notify-event", `Diagnostics started. Please wait a few minutes`)
                let diagnosticDevices = [];
                try{
                    diagnosticDevices = await diagnoseDevices(instance, devices, socket, db, analyticsSocket);
                    socket.emit("notify-event", `${instance.name}: ${diagnosticDevices.length} devices diagnosed`)
                }catch(err){
                    console.log(err)
                }
                if(analyticsSocket != null){
                    let user = {
                        clientId: 14,
                        lastLogin: Date.now(),
                        permission: "client"
                    }
                    // let user = db.prepare(`SELECT * FROM user_table WHERE id=1`).get();
                    analyticsSocket.emit("set-diagnostic-devices", diagnosticDevices, user["clientId"]);
                }
                socket.emit("diagnosed-devices", diagnosticDevices);
                server.sockets.emit("instance-diagnosed", instance);
            })

            diagnosticSocket.on("diagnostic-devices-res", (id, devices)=>{
                if(id != null){
                    let times = [];
                    try{
                        let settings = db.prepare(`SELECT * FROM user_${id}_settings`).get();
                        times = settings.diagnosticTimes.split(",")
                    
                    let file = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}file.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}file.json`);
                    let fileJSON = JSON.parse(file);
                    for(const instance of fileJSON.instances){ 
                        for(const time of times){
                            let job = scheduleDiagnostics(time, instance, devices[instance.id], socket, db);
                            runtime.jobs[time] = job
                        }
                    }
                    }catch(err){

                    }
                }
            })

            diagnosticSocket.on("terminal-logs", (logs, instance)=>{
                socket.emit("logs-received", logs, instance)
            })
        }          
    });
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
app.on("before-quit", async (event)=>{
    try{
        if(isDev){
        var manifest = isDev ? fs.readFileSync(`${app.getAppPath()}${slash}public${slash}ph-manifest.json`) : fs.readFileSync(`${app.getAppPath()}${slash}build${slash}ph-manifest.json`);
        var manifestObj = JSON.parse(manifest);
        let file = {
            instances: [],
            devices: []
        }
        fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.json`, JSON.stringify(file));
        await clearAllTables(db, manifestObj.drivers);   
    }
    db.close(); 
    }catch(err){
        console.log(err);
    }
    for(let thread of threadManager.threads){
        thread.process.send("close", null);
    }
    server.close(()=>{
    });
    let wins = BrowserWindow.getAllWindows();
    
    for(let win of wins){
        try{
            win.close()
        }catch(err){
            console.log(err);
        }finally{
            win.destroy();
        }
    }

    try{
        ipcMain.removeAllListeners("ready")
        if(diagnosticSocket != null){
            diagnosticSocket.close();
        }
        if(helperSocket != null){
            helperSocket.close();
        }
        if(analyticsSocket != null){
            analyticsSocket.close();
        }
    }catch(err){
        console.log(err)
    }
})

module.exports = {
    bindingDevice: bindingDevice,
    insertDeviceIntoTable: insertDeviceIntoTable,
    createDiagnosticTable: createDiagnosticTable,
    insertDiagnosticDeviceIntoTable: insertDiagnosticDeviceIntoTable,
    alterInstance: alterInstance,
    alterDevice: alterDevice,
    deleteInstance: deleteInstance,
    deleteDevice: deleteDevice,
    createBackEndInstance: createBackEndInstance,
    writeToInstance: writeToInstance
}