const Telnet = require("telnet-client");
const csv = require("csv");
const xlsx = require("xlsx");
const fs = require("fs");
/**
 * @function inspectInstance
 * @param {object} instance 
 * @description Gathers relevant information for an instance. In the case of Vantage, this will include ethernetInfo, systemInfo and a channel number in the form of serialized XML strings
 */
async function inspectInstance(master = null,instance = null){
    let inspection = {
        ethernetInfo: null,
        systemInfo: null,
        channel: null,
        version: null
    }
    if(instance == null){
        return null;
    }
    else if(instance.service == "Telnet"){
        let socket = new Telnet();

        socket.connect({
            host: instance.address,
            port: 2001,
            sendTimeout: 10000,
            timeout: 15000
        });
        socket.on("error", ()=>{
            inspection = {
                id: instance.id,
                status: "offline"
            }
        });

        let etheRes = "";
        let sysRes = "";
        let channelRes = "";
        let versionRes = "";
        if(master != null){
            socket.send(`<?Master ${master}?>`);
        }

        try{
            etheRes = await socket.send("<IDiagnostic><GetEthernetInfo><call></call></GetEthernetInfo></IDiagnostic>");
            channelRes = await socket.send("<IConfiguration><GetM2MChannel><call></call></GetM2MChannel></IConfiguration>");
            sysRes = await socket.send("<IIntrospection><GetSysInfo><call></call></GetSysInfo></IIntrospection>");
            versionRes = await socket.send("<IIntrospection><GetVersion><call></call></GetVersion></IIntrospection>")
        }catch(err){

        }
        
        if(inspection.status != "offline"){
            inspection = {
                id: instance.id,
                ethernetInfo: etheRes,
                systemInfo: sysRes,
                channel: channelRes,
                versionRes: versionRes
            }    
        }
        
        socket.destroy();
        socket = null;
    }
   
    return inspection;
}

/**
 * @function convertVantageResponseToPhoenixResponse
 * @param {string} res 
 * @description Takes a string response from vantage processor and tries to convert it to a PI response. If it can't, it will just return the response.
 */
function convertVantageResponseToPhoenixResponse(res){
    let phoenixResponse = [];
    res = res.replace("S:", "").replace("R:", "").replace("STATUS ALL", "Online!").replace("GETLOAD", "LOAD").replace("LIGHT", "LIGHTSENSOR")
              .replace("THERMTEMP", "HVAC").replace("BLIND", "SHADE").replace("TEMP", "HVAC")
              .replace("GETBLIND", "SHADE").replace(" POS ", "")
              .replace("INDOOR", "ROOM").replace("BTNPRESS", "SCENE").replace("PRESS", "1").replace("EVENT", "").replace("BTN", "SCENE").replace("RELEASE", "0")
              .replace("LED", "SCENELED").replace("STATUS", "STAT_STREAM").replace("Button.GetState", "SCENE");
    if(!res.includes("LOAD") && !res.includes("HVAC") && !res.includes("SHADE") && !res.includes("SCENE")){
        return res
    }else{
        var response = res.split(" ");
        
        if(response[0].toLowerCase() == "stat_stream"){
            if(response.includes("SCENE")){
                phoenixResponse = `vantagescene_${response[1]}`;
                if(response[3] == "1"){
                    phoenixResponse = `${phoenixResponse}_on`;
                }else{
                    phoenixResponse = `${phoenixResponse}_off`;
                }
            }
        }else{
            phoenixResponse = `vantage${response[0].toLowerCase()}`;
            if(phoenixResponse.includes("sceneled")){
                phoenixResponse = `vantagescene_${response[1]}`;
                
                if(response[2] == "1"){
                    phoenixResponse = `${phoenixResponse}_on`;
                }else{
                    phoenixResponse = `${phoenixResponse}_off`;
                }
                console.log(phoenixResponse, res)
            }else{
                for(var i = 1; i < response.length; i++){
                    let pRes = response[i];
                    if(Number.isNaN(parseInt(pRes))){
                        phoenixResponse += `_${pRes.toLowerCase()}`
                    }else{
                        phoenixResponse += `_${pRes}`
                    }
                }
            }
        }
                
        return phoenixResponse
    }
}

function convertPhillipsHueToPhoenixResponse(response){
    let responses = [];
    if(typeof response == string){
        response = JSON.parse(response);
    }
    for(let prop of response){
        if(prop.success){
            
        }
    }
}

/**
 * @function DriverFactory
 * @param {object} driver 
 * @desc Takes a PI Driver and Creates Runtime Operational Device.
 * @returns {object}
 */
function DriverFactory(driver){
    driver.functions.forEach((funct)=>{
        try{
            var temporaryFunction = new Function(funct.params, funct.body);
            driver[funct.name] = temporaryFunction.bind(driver);        
        }catch(err){
            console.log(err)
            console.log(funct);
        }
            })

    return driver;
}

/**
 * @function APIReader
 * @param {string} apiCall
 * @description Converts PI API Call into object to use
 * @returns {object} 
 */
function APIReader(apiCall){
    var callArr = apiCall.split("_");

    return {
        type: callArr[0],
        id: callArr[1],
        func: callArr[2],
        params: callArr.slice(3)
    }
}
/**
 * @funciton alterInstanceTable
 * @param {Database} database 
 * @param {object} file 
 * @param {object} instance
 *  
 */
function alterInstanceTable(database = null, file, instance){
    let cols = [];
    let rows = [];

    let index = file.instances.findIndex((fileInstance)=>{
        return fileInstance.id == instance.id
    })
    file.instances[index] = instance;
    return file;
}

/**
 * @function importInstancesFromCSV
 * @param {string} csvDoc serialized string of CSV file 
 * @param {Database} database Sqlite database
 * @param {object} file PI File in Object literal form
 */
async function importInstancesFromCSV(csvDoc, file){
    let parser = csv.parse(csvDoc);
    let props;
    await parser.on("data", (line)=>{
        let instance = {};
        if(line.indexOf("Id") > -1){
            props = line
        }else{
            for(var i = 0; i < props.length; i++){
                if(props[i] == "Id" || props[i] == "Port"){
                    instance[props[i].toLowerCase()] = parseInt(line[i]);
                }else{
                    instance[props[i].toLowerCase()] = line[i];
                }
            }
            file.instances.push(instance);
        }
    })
    return file
}

function exportReports(reportJSON, path){
    let report = xlsx.utils.book_new();
    report.SheetNames.push("instances");
    report.Props = {
        Title: "Pi Report",
        Author: "Totally in View",
        CreatedDate: new Date()
    }
    let instances = []
    let instanceHeader = []
    for(const instance in reportJSON){
       let types = reportJSON[instance].types;
        instances.push(reportJSON[instance].info);
        instanceHeader = Object.getOwnPropertyNames(reportJSON[instance].info);
        types.forEach((type)=>{
            report.SheetNames.push(`${type.toLowerCase().substring(0, 31)}`)
            let reportInfo = [];
            let header = []
            reportJSON[instance].devices.forEach((device)=>{
                if(device.type == type){
                    reportInfo.push(device);
                    header = Object.getOwnPropertyNames(device);
                }
            });
            let sheet = xlsx.utils.json_to_sheet(reportInfo, {header: header});
            report.Sheets[`${type.toLowerCase()}`] = sheet;
        });
    }

    report.Sheets["instances"] = xlsx.utils.json_to_sheet(instances, {header: instanceHeader});
    xlsx.writeFile(report, path);
}

async function findStation(instance, master,serialNum){
    let socket = new Telnet();
    let stationRes = ""
    try{
        socket.connect({
        host: instance.address,
        port: 2001,
        sendTimeout: 5000,
        timeout: 500
    });
    socket.send(`<?Master ${master}?>`);
    stationRes = await socket.send(`<IDiagnostic><FindStation><call>${serialNum}</call></FindStation></IDiagnostic>`)
        await socket.destroy();
        socket = null;
    }catch(err){
        0;
    }
    if(stationRes.includes("true")){
        return "true"
    }else{
        return "false"
    }
}

async function getStation(instance, master, serialNum){
    let xml2js = require("xml2js");
    let parser = new xml2js.Parser();
    let socket = new Telnet();

    socket.on("timeout", ()=>{
    })
    let stationRes = ""
    let objRes = {
        Version: null,
        online: "false",
        address: null,
    }
    try{
        socket.connect({
        host: instance.address,
        port: 2001,
        sendTimeout: 5000,
        timeout: 500
    });

    socket.on("error", (err)=>{
        console.log(err)
    })
    socket.send(`<?Master ${master}?>`);
    stationRes = await socket.send(`<IDiagnostic>
                                        <GetStation>
                                            <call>${serialNum}</call>
                                        </GetStation>
                                    </IDiagnostic>`)
        await socket.destroy();
        socket = null;
    }catch(err){
        0;
    }
    try{
        parser.parseString(stationRes, (err, res)=>{
            let info = res.IDiagnostic.GetStation[0].return[0];
    
            if(info.IPAddress != null){
                objRes.address = info.IPAddress[0];
            }
    
            if(info.Version != null){
                objRes.Version = info.Version[0];
            }
    
            if(info.Online != null){
                objRes.online = info.Online[0];
            }
        });
    }catch(err){
    }
    
    return objRes;
}

async function getStationBuses(instance, master){
    let socket = new Telnet();
    let buses = "";

    try{
        socket.connect({
            host: instance.address,
            port: 2001,
            sendTimeout: 5000,
            timeout: 500
        });
        socket.send(`<?Master ${master}?>`);
        buses = await socket.send(`<IDiagnostic><GetStationBuses><call /></GetStationBuses></IDiagnostic>`);
    }catch(err){
        console.log(err);
    }

    return buses
}

async function getFile(filename="Project.dc", telnetsocket, params, socket, instance=null){
    var file;
    var command = `<IBackup><GetFile><call>Backup/${filename}</call></GetFile></IBackup>`;
    telnetsocket.connect({...params, sendTimeout: 10000, maxBufferLength: 5000000});
    telnetsocket.on("error", (err)=>{
        console.log(err);
    })
    
    telnetsocket.on("connect", ()=>{
        
       
        telnetsocket.send(command, async (err, res)=>{
            if(err){

            }
            else{
                var dcFile64 = res.replace("<IBackup>", "").replace("<GetFile>", "").replace("<return>", "").replace("<Result>true</Result>", "").replace("<?File Encode=\"Base64\" /", "").replace(">", "").replace("</return>", "").replace("</GetFile>", "").replace("</IBackup>", "");
                let buff = Buffer.from(dcFile64, 'base64');

                let file = await buff.toString();
                fs.writeFileSync(`${app.getAppPath()}${slash}public${slash}file.dc`, file);
                socket.emit("file-returned", {file:file, instance: instance});
            }
        })
    })

  }

  function createTriggerReport(devices, instances, path){
    let report = xlsx.utils.book_new();
    report.SheetNames.push("Trigger Report");
    let info = [["Button/Timer/Motion", "Instance", "Area","Devices","Timer Time", "Timer Days"]]
    // console.log(devices);
    for(let i = 0; i < devices.length; i++){
        let device = devices[i];
        if(device.type != null){
            if(device.type == "Button" || device.type.includes("Sensor") || device.type == "Timer"){
                let deviceInfo = [];
                deviceInfo.push(device.name);
                let instance = instances.find(fileInstance=>{
                    return device.instanceId == fileInstance.id
                });
                deviceInfo.push(instance.name);
                if(device.area != null){
                    deviceInfo.push(device.area);
                }else{
                    deviceInfo.push("N/A")
                }
                if(device.type == "Button"){
                    let task = device.uptask;
                        if(task == null){
                            task = device.holdtask;
                            if(task == null){
                                task = device.downtask
                            }
                        };

                        if(task != null){
                            deviceInfo.push(task.params.toString().replace(",", ", "))
                            deviceInfo.push("N/A");    
                            deviceInfo.push("N/A");
                        }else{
                            deviceInfo.push("N/A");
                            deviceInfo.push("N/A");
                            deviceInfo.push("N/A");
                        }
                    info.push(deviceInfo);  
                }
                if(device.type.includes("Sensor")){
                    if(deviceInfo.occupancytask != null){
                        deviceInfo.push(device.occupancytask.params.toString().replace(",", ", "));
                        deviceInfo.push("N/A");
                        deviceInfo.push("N/A");
                    }else{
                        deviceInfo.push("N/A");
                        deviceInfo.push("N/A");
                        deviceInfo.push("N/A");
                    }
                    info.push(deviceInfo);
                }
                if(device.type == "Timer"){
                    
                    deviceInfo.push(device.eventObjects.toString().replace(",", ", "));
                    deviceInfo.push(device.eventTime);
                    deviceInfo.push(device.eventDays);
                    info.push(deviceInfo);
                }
            }    
        }
    }
    report.Sheets["Trigger Report"] = xlsx.utils.aoa_to_sheet(info)
    xlsx.writeFile(report, path);
}

function createAsBuiltReport(asBuilt, path){
    let report = xlsx.utils.book_new();
        for(const sheet in asBuilt){
            let sheetHeader = null;
            try{
                sheetHeader = Object.keys(asBuilt[sheet][0]);
            }catch(err){
            }
            if(sheetHeader != null){
                let data = asBuilt[sheet];  
                for(let row of data){
                    for(const prop of sheetHeader){
                        if(Array.isArray(row[prop])){
                            row[prop] = row[prop].toString();
                        }
                    }
                }
                let ws = xlsx.utils.json_to_sheet(data, {
                    header: sheetHeader
                });
                xlsx.utils.book_append_sheet(report, ws, sheet);
            }
            
        }
        xlsx.writeFile(report, path);
}

function createNetworkReport(network, path){
    console.log(network, path);
    try{
        let report = xlsx.utils.book_new();
        let sheets = Object.keys(network);
        for(const sheet of sheets){
            let header = Object.keys(network[sheet][0]);
            let data = network[sheet];
            for(let row of data){
                for(const prop of header)
                if(Array.isArray(row[prop])){
                    row[prop] = row[prop].toString();
                }
            }
            let ws = xlsx.utils.json_to_sheet(data, {header: header});
            xlsx.utils.book_append_sheet(report, ws, sheet)

        }
         xlsx.writeFile(report, path)
    }catch(err){
        console.log(err);
    }
   
}

function createBusReport(bus, path){
    let report = xlsx.utils.book_new();
    try{
        let sheets = Object.keys(bus);
        for(const sheet of sheets){
            let header = Object.keys(bus[sheet][0]);
            let data = bus[sheet];
            for(let row of data){
                for(const prop of header)
                if(Array.isArray(row[prop])){
                    row[prop] = row[prop].toString();
                }
            }
            let ws = xlsx.utils.json_to_sheet(data, {header: header});
            xlsx.utils.book_append_sheet(report, ws, sheet)
        }
    }catch(err){

    }
    xlsx.writeFile(report, path)
}
function createAnalyticsReport(analytics, path){
    let report = xlsx.utils.book_new();

    analytics.forEach((sheet)=>{
        let name = sheet.name.subString(0, 30);
        if(report.SheetNames.indexOf(name) < 0){
            
            report.SheetNames.push(name);
            
            let sheetHeader = [];
            let data = sheet.data;
            for(let row of data){
                let props = Object.keys(row);
                for(const prop of props){
                    if(sheetHeader.indexOf(prop) < 0){
                        sheetHeader.push(prop);
                    }
                    if(prop == "eventTime"){
                        let date = new Date();
                        date.setTime(row[prop]);
                        row[prop] = date.toString();
                    }
                }
            }
            report.Sheets[name] = xlsx.utils.json_to_sheet(data, {header: sheetHeader});        
        }
    })
    try{
        xlsx.writeFile(report, path);
    }catch(err){
        console.log(err);
    }
}


async function discoverPhillipsHue(instance, socket){
    let request = require("request");
    let error = null;
    let devices = [];
    if(instance.token == "" || instance.token == null){
        request({
            method: "POST",
            uri: `http://${instance.address}/api`,
            body: {
                devicetype: `Pi ${instance.name}`,
            },
            json: true,
        }, (err, res, body)=>{
            if(err){
            }else{
                if(body[0].error){
                    error = body[0].error
                    socket.emit("notify-event",error.description);
                }else{
                    instance.token = body[0].success.username
                    socket.emit("instance-token", instance);
                    request({
                        method: "GET",
                        uri: `http://${instance.address}/api/${instance.token}/lights`,
                        json: true
                    }, (err, res, body)=>{
                        if(err){
                            console.log(err);
                        }else{
                            socket.emit("hue-devices-returned", instance, body);
                        }
                    });
                }
            }
        })
    }else{
        await request({
            method: "GET",
            uri: `http://${instance.address}/api/${instance.token}/lights`,
            json: true
        }, (err, res, body)=>{
            if(err){
                console.log(err);

            }else{
                socket.emit("hue-devices-returned", instance, body);
            }
        });
    }
}

function discoverLIFX(instance, socket){
    let request = require("request");
    if(instance.token === ""){
        request({
            method: "GET",
            uri: "http://cloud.lifx.com/oauth/authorize",
            json: true,
            headers: {
                "User-Agent": "PI_APP_TOKEN"
            }
        }, (err, res, body)=>{
            if(err){
                console.log(err);
            }else{
                if(body.status < 400){
                    try{
                        socket.emit("notify-event", body.error);
                    }catch(err){

                    }
                }else{
                    console.log(body)
                }
                
            }
        })
    }else{
        request({
            method: "GET",
            uri: `${instance.address}/lights/all`,
            json: true,
            auth: {
                'bearer': instance.token
            }
        }, (err, res, body)=>{
            if(err){

            }else{
                socket.emit("lifx-devices-returned", instance, body)
            }
            
        })
    }
}

module.exports = {
    inspectInstance: inspectInstance,
    convertVantage: convertVantageResponseToPhoenixResponse,
    DriverFactory: DriverFactory,
    APIReader: APIReader,
    alterInstanceTable: alterInstanceTable,
    importInstancesFromCSV: importInstancesFromCSV,
    findStation: findStation,
    getStationBuses: getStationBuses,
    exportReports: exportReports,
    getStation: getStation,
    createTriggerReport: createTriggerReport,
    createAnalyticsReport: createAnalyticsReport,
    createAsBuiltReport: createAsBuiltReport,
    createNetworkReport: createNetworkReport,
    createBusReport: createBusReport,
    discoverPhillipsHue: discoverPhillipsHue,
    discoverLIFX: discoverLIFX
}