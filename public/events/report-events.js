let fs = require("fs");

async function generateGeneralReport(path){
    let file = fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);
    let report = {}
    for await(const instance of fileJSON.instances){
        report[instance.name] = {
            info: {},
            devices: [],
            types: []
        }
        if(instance.inspection != null){
            report[instance.name].info = {...instance.inspection, name: instance.name, type: instance.service, address: instance.address, port: instance.port, id: instance.id};
        }else{
            report[instance.name].info = {name: instance.name, type: instance.service, address: instance.address, port: instance.port, id: instance.id};
        } 
        let diagnosticDevices = JSON.parse(fs.readFileSync(`${path}diagnosis_${instance.id}.json`)).devices;
        diagnosticDevices.forEach((device)=>{
            if(report[instance.name].types.indexOf(device.type) < 0){
                report[instance.name].types.push(device.type);
            }
            report[instance.name].devices.push(device);
        });                   
    }

    return report
}

function generateAsBuiltReport(path){
    let file = fs.readFileSync(`${path}file.json`)
    let fileJSON = JSON.parse(file);
    let report = {network: []};
    for(const instance of fileJSON.instances){
        let diagnosticDevices = JSON.parse(fs.readFileSync(`${path}diagnosis_${instance.id}.json`)).devices;
        report.network.push({
            serialnumber: instance.inspection[0].serialnumber,
            ip: instance.address,
            mac: instance.inspection[0].mac
        })
        for(const diagnosticDevice of diagnosticDevices){
            if(diagnosticDevice.type == "Button"){
                try{
                    let row;
                let parent = diagnosticDevices.find(device =>{
                    return diagnosticDevice.parent == device.id && diagnosticDevice.parenttype == device.type
                })
                if(parent != null){
                    if(report[parent.type] != null){
                        row = report[diagnosticDevice.parenttype].find(reportRow => {
                            return parent.name == reportRow.name
                        }) 
                       if(row == null){
                            row = {
                                area: diagnosticDevice.area,
                                name: parent.name,
                                buttons: [diagnosticDevice.name],
                                buttonConfig: ``,
                                scenes: [],
                                serialnumber: parent.serialnumber,
                                instance: instance.name,
                                bus: `${parent.bustype} ${parent.bus}`,
                                ip: parent.address
                            }
                        }
                        for(const prop in diagnosticDevice){
                            if(prop.includes("task")){
                                if(row.scenes.indexOf(diagnosticDevice[prop].name) < 0){
                                    row.scenes.push(diagnosticDevice[prop].name)
                                }
                                if(row.buttons.indexOf(diagnosticDevice.name) < 0){
                                    row.buttons.push(diagnosticDevice.name);
                                }
                            }
                        }
                        row.buttonConfig = `${row.area} ${row.buttons.length} btn` 
                        let rowIndex = -1;
                        try{
                            rowIndex = report[parent.type].findIndex((reportRow)=>{
                                return row.name == reportRow.name
                            })
                        }catch(err){

                        }
                        if(rowIndex == -1){
                            report[parent.type].push(row)
                        } 
                    }else{
                        row = {
                            area: diagnosticDevice.area,
                            name: parent.name,
                            buttons: [diagnosticDevice.name],
                            buttonConfig: ``,
                            scenes: [],
                            serialnumber: parent.serialnumber,
                            instance: instance.name,
                            bus: `${parent.bustype} ${parent.bus}`,
                            ip: parent.address
                        }
                        
                        for(const prop in diagnosticDevice){
                            if(prop.includes("task")){
                                if(row.scenes.indexOf(diagnosticDevice[prop].name) < 0){
                                    row.scenes.push(diagnosticDevice[prop].name)
                                }
                                if(row.buttons.indexOf(diagnosticDevice.name) < 0){
                                    row.buttons.push(diagnosticDevice.name);
                                }
                                    
                            }
                        }
                        row.buttonConfig = `${row.area} ${row.buttons.length} btn` 
                        report[parent.type] = [row]
                    }
                }
                
                for(const prop in diagnosticDevice){
                    if(prop.includes("task")){
                        let task = diagnosticDevice[prop];
                        for(const param of task.params){
                            let device = diagnosticDevices.find(taskDevice =>{
                                return taskDevice.name == param
                            })
                            if(device != null){
                                if(report[device.type] == null){
                                    report[device.type] = []
                                }
                               let parent = diagnosticDevices.find(dDevice=>{
                                    return device.parenttype == dDevice.type && dDevice.id == device.parent
                                });
                                let row = report[device.type].find(reportRow=>{
                                    return device.id == reportRow.vid
                                });
                                if(parent != null){
                                    if(row == null){
                                        if(device.parentposition != null){
                                            row = {
                                                area: device.area,
                                                name: device.name,
                                                vid: device.id,
                                                parent: `${parent.type} ${parent.name}`,
                                                position: device.parentposition,
                                                connections: [parent.name, diagnosticDevice.name]
                                            }    
                                        }else{
                                            row = {
                                                area: device.area,
                                                name: device.name,
                                                vid: device.id,
                                                parent: `${parent.type} ${parent.name}`,
                                                connections: [parent.name, diagnosticDevice.name]
                                            }
                                        }
                                            
                                    }else{
                                        if(row.connections.indexOf(diagnosticDevice.name) < 0){
                                            row.connections.push(diagnosticDevice.name);
                                        }
                                    }
                                    let rowIndex = -1;
                                    try{
                                        rowIndex = report[device.type].findIndex((reportRow)=>{
                                            return row.name == reportRow.name
                                        })
                                    }catch(err){
                                        console.log(err)
                                    }
                                    if(rowIndex == -1){
                                        report[device.type].push(row)
                                    } 
                                }   
                            }  
                        }
                    }
                }
                }catch(err){
                    console.log(err);
                } 
            }
        }
    }

    return report;
}

function generateNetworkReport(path){
    let file = fs.readFileSync(`${path}file.json`)
    let fileJSON = JSON.parse(file);
    let report = {};

    for(const instance of fileJSON.instances){
        let diagnosticDevices = JSON.parse(fs.readFileSync(`${path}diagnosis_${instance.id}.json`)).devices;
        report[instance.name] = [];
        for(const device of diagnosticDevices){
            if(device.address != null || device.ipaddress != null){
                let address = device.address == null ? device.ipaddress : device.address
                report[instance.name].push({
                    name: device.name,
                    address: address,
                    type: device.type,
                    version: device.Version,
                    serialnumber: device.serialnumber
                });
            }
        }
    }
    return report
}

async function generateBusReport(path){
    let file = fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);

    let report = {};
    let buses = {}
    for(const instance of fileJSON.instances){
        let {devices, busXML} = JSON.parse(fs.readFileSync(`${path}diagnosis_${instance.id}.json`));
        let xml2js = require("xml2js");
        let parser = new xml2js.Parser();
        buses[instance.id] = {};
        
        for await(let bus of busXML){
            buses[instance.id][bus.master] = []
            try{
                parser.parseString(bus.busXML, (err, res)=>{
                    let busesInfo = res.IDiagnostic.GetStationBuses[0].return;
                    busesInfo.forEach((busArr)=>{
                        let busObjects = busArr.Bus;
                        for(let busObj of busObjects){
                            report[`${instance.name} - Processor ${bus.master} - ${busObj.Type[0].replace(" Bus", "").replace("Ethernet", "EthernetLink")} Bus ${busObj.ID[0]}`] = []
                        }
                    });
                });
            }catch(err){

            }
        }

        for(let device of devices){
            let master = devices.find(masterDevice => {
                return masterDevice.id == device.master
            })
            if(device.bus != null && device.bustype != null && master != null && master.number != null){
                if(report[`${instance.name} - Processor ${master.number} - ${device.bustype} Bus ${device.bus}`] == null){
                    report[`${instance.name} - Processor ${master.number} - ${device.bustype} Bus ${device.bus}`] = [{
                            name: device.name,
                            type: device.type,
                            online: device.online,
                            area: device.area
                    }]
                }else{
                    report[`${instance.name} - Processor ${master.number} - ${device.bustype} Bus ${device.bus}`].push({
                        name: device.name,
                        type: device.type,
                        online: device.online,
                        area: device.area
                    })
                }
                
            }
        }
    }
    return report
}

function generateTriggerReport(path){
    let report = {};
    let file = fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);
    for(const instance of fileJSON.instances){
        if(instance.service == "Telnet" && instance.port == 3001){
           
            let {devices, busXML} = JSON.parse(fs.readFileSync(`${path}diagnosis_${instance.id}.json`));
            for(let device of devices){
                if(device.type != null){
                    if(device.type == "Button" || device.type.includes("Sensor") || device.type == "Timer"){
                        if(report[`${instance.name} ${device.type} Trigger Report`] == null){
                            report[`${instance.name} ${device.type} Trigger Report`] = []
                        }
                        let deviceInfo = {
                            "Button/Timer/Motion": "",
                            "Area": "",
                            "Devices": "",
                            "Timer Time": "",
                            "Timer Days": ""
                        };
                        deviceInfo["Button/Timer/Motion"]= device.name;
                        if(device.area != null){
                            deviceInfo["Area"] = device.area;
                        }else{
                            deviceInfo["Area"] = "N/A";
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
                                    deviceInfo["Devices"] = task.params.toString().replace(",", ", ")
                                    deviceInfo["Timer Time"] = "N/A";    
                                    deviceInfo["Timer Days"] = "N/A";
                                }else{
                                    deviceInfo["Devices"] = "N/A";    
                                    deviceInfo["Timer Time"] = "N/A";    
                                    deviceInfo["Timer Days"] = "N/A";
                                }
                            report[`${instance.name} ${device.type} Trigger Report`].push(deviceInfo);  
                        }
                        if(device.type.includes("Sensor")){
                            if(deviceInfo.occupancytask != null){
                                deviceInfo["Devices"] = device.occupancytask.params.toString().replace(",", ", ");
                                deviceInfo["Timer Time"] = "N/A";    
                                deviceInfo["Timer Days"] = "N/A";
                            }else{
                                deviceInfo["Devices"] = "N/A";    
                                    deviceInfo["Timer Time"] = "N/A";    
                                    deviceInfo["Timer Days"] = "N/A";
                            }
                            report[`${instance.name} ${device.type} Trigger Report`].push(deviceInfo);
                        }
                        if(device.type == "Timer"){
                            
                            deviceInfo["Devices"] = device.eventObjects.toString().replace(",", ", ");
                            deviceInfo["Timer Time"] = device.eventTime;
                            deviceInfo["Timer Days"] = device.eventDays;
                            report[`${instance.name} ${device.type} Trigger Report`].push(deviceInfo);
                        }
                    }    
                }
            }    
        }
    }
    return report
}

function generateDailyEventsReport(devices, commisionDevices, clientId, analytics){
    const DATES = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ]
    let report = {};
    let finalReport = {};
    let timers = devices.filter(device =>{
        return device.type == "Timer" && device.eventObjects != null && device.eventTime != null && device.eventDays != null
    })
    let dates = [];
    
    for(let i = 6; i >= 0; i--){
        dates[i] = new Date();
        dates[i].setDate(date.getDate()-i);
    }
    if(timers != null){
        for(const timer of timers){
            let eventDevices = []
            for(const eventObj of timer.eventObjects){
                let eventDevice = commisionDevices.find(commisionDevice=>{
                    return eventObj == commisionDevice.props.name;
                });
                if(eventDevice != null){
                    eventDevices.push(eventDevice);
                }
            }
            let days = timer.eventDays.split(",");
            for(const day of days){
                report[`${day} - ${timer.name} - ${timer.eventTime}`] = eventDevices;
            }
        }
    }

    for(const sheet in report){
        let devices = report[sheet];
        let timerInfo = sheet.split( " - ");
        let timerDay = timerInfo[0];
        let timerTime = timerInfo[2];
        for(const device of devices){
            let data = analytics.find(chart=>{
                return chart.device == `analytics_${clientId}_${device.props.instanceId.id}_${device.props.type.toLowerCase()}_${device.props.id}`;
            })

            for(const point of data){
                let time = new Date(point.eventTime);
                if(date.getDay() == DATES[timerDay.toLowerCase()]){

                }
                if(device.props.type.toLowerCase().includes("load")){

                }
            }

        }
    }
}
module.exports = {
    generateAsBuiltReport: generateAsBuiltReport,
    generateGeneralReport: generateGeneralReport,
    generateNetworkReport: generateNetworkReport,
    generateBusReport: generateBusReport,
    generateTriggerReport: generateTriggerReport
}