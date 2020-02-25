let io = require("socket.io");
let fs = require("fs");
let process = require("process");
let path = require("path");
/** 
 * A database
 * @typedef {Object} Database
 * 
 */

/** 
 * File
 * @typedef {Object} File
 * @property {array} instances - An Array of instances
 * @property {array} devices - An Array of devices
 */


/** 
 * A Network Instance
 * @typedef {Object} Instance
 * 
 */

/**
 * @function addDevicesToDB
 * @param {object} data - Information coming from the frontend for insertion into DB
 * @param {File} file - File to store new devices;
 * @param {Database} database - Database to store information;
 * @param {object} manifest - Manifest is used to create Pi Devices;
 * @param {object} diagnosticSocket - Connection to Diagnostic Database to relay information
 * @param {string} path - Path used to write new files;
 * 
 * @return {object} - Obeject holding the newFile and the devices that were added to databse
 * 
 */
async function addDevicesToDB(data, file, database, manifest, diagnosticSocket, path){
    let { bindingDevice, insertDeviceIntoTable, createDiagnosticTable, insertDiagnosticDeviceIntoTable } = require(`${path}electron`);

    let {devices, diagnosticDevices, instance} = data;
    let devicesArr = [];
    let fileInstance = file.instances.find(i=>{
        return instance.name == i.name
    });
    
    for await(let device of devices){
        device.instance = fileInstance;
        let boundDevice = bindingDevice(device, manifest.drivers);
        let diagnosticDevice = diagnosticDevices.find(dDevice=>{
            return dDevice.id == boundDevice.props.id
        });

        let deviceIndex = devicesArr.findIndex(deviceItem =>{
            return boundDevice.props.type == deviceItem.props.type && boundDevice.props.id == deviceItem.props.id
        });

        let fileDeviceIndex = file.devices.findIndex(fileDevice=> {
            return fileDevice.props.type == boundDevice.props.type && fileDevice.props.id == boundDevice.props.id && fileDevice.props.instanceId.id == boundDevice.props.instanceId.id
        })
        if(deviceIndex < 0 && fileDeviceIndex < 0){
            if(diagnosticDevice != null){    
                devicesArr.push({...boundDevice, props:{...boundDevice.props, instanceId: {...boundDevice.props.instanceId}, diagnosticType: diagnosticDevice.type}});
            }else{
                devicesArr.push({...boundDevice, props:{...boundDevice.props, instanceId: {...boundDevice.props.instanceId}}});
            }
            try{
                insertDeviceIntoTable(boundDevice, database);
            }catch(err){
            }
        }
    }

    for await(let diagnosticDevice of diagnosticDevices){
        try{
            diagnosticDevice.instanceId = fileInstance.id;
            createDiagnosticTable(diagnosticDevice, diagnosticSocket);
        }catch(err){

        }
        try{
            insertDiagnosticDeviceIntoTable(diagnosticDevice, diagnosticSocket);
        }catch(err){
        }
            
    }
    let newFile = {instances: [...file.instances], devices: [...file.devices, ...devicesArr]}
    return {devicesArr: devicesArr, newFile: newFile};
}
/**
 * @function addInstanceToDB
 * @param {Instance} instance - A new instance to add to file
 * @param {File} file - The File to add the instance
 * @param {string} path - A path to write the new file to
 */
function addInstanceToDB(instance, file, filePath){
    let { inspectInstance } = require(path.join(filePath, `Pi`));
    const uuid = require("uuid/v4")
    let inspection;
    let newFile;
    try{
        let id = uuid();
        let instanceIndex = file.instances.findIndex(fileInstance=>{
            return id == fileInstance.id
        });
        while(instanceIndex != -1){
            id = uuid();
            instanceIndex = file.instances.findIndex(fileInstance=>{
                return id == fileInstance.id
            });
        }
        instance.id = id;
        file.instances = [...file.instances,instance];
        inspection = inspectInstance(null, instance);
        
        newFile = JSON.stringify(file);
        let writeToPath = path.join(filePath, 'file.json');
        fs.writeFileSync(writeToPath, newFile);
        fs.writeFileSync(path.join(filePath,`diagnosis_${instance.id}.json`), JSON.stringify({devices: [], busXML: ""}));
    }catch(err){
        console.log(err);
    }

    return {newFile: file, inspection: inspection};
}

/**
 * @function alterDeviceInDB
 * @param {object} alterations - Alterations to be made to a specific device
 * @param {Database} database - The Database to alter a device
 * @param {string} path - A path to write the new file to
 */

async function alterDeviceInDB(alterations, database, path){
    let {alterDevice} = require(`${path}electron`);
    let file = fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);
    try{
        fileJSON =  await alterDevice(database, fileJSON, alterations.currentdeviceId, alterations.device);
    }catch(err){
    }
    let newFile = JSON.stringify(fileJSON);
    fs.writeFileSync(`${path}file.json`, newFile)
    return fileJSON
}

/**
 * @function alterInstanceInDB
 * @param {object} alterations - Alterations to be made to a specific instance
 * @param {Database} database - The Database to alter instance
 * @param {string} path - A path to write the new file to
 */
async function alterInstanceInDB(alterations, database, path){
    let {alterInstance} = require(`${path}electron`);
    let file = fs.readFileSync(`${path}file.json`)
    let fileJSON = JSON.parse(file);
    try{
        fileJSON = await alterInstance(database, fileJSON, alterations.currentInstanceId, alterations.instance);
    }catch(err){
    }
    let newFile = JSON.stringify(fileJSON);
    fs.writeFileSync(`${path}file.json`, newFile)
    return fileJSON
}

/**
 * @function deleteDeviceFromDB
 * @param {Device} device - The device to be deleted from Database;
 * @param {Database} database - The Database to delete device
 * @param {string} path - A path to write the new file to
 */
async function deleteDeviceFromDB(device, database, path){
    let {deleteDevice} = require(`${path}electron`);
    let file = fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);
    try{
        fileJSON = await deleteDevice(database, fileJSON, device.props.type, device.props.id, device.props.instanceId.id); 
        let newFile = JSON.stringify(fileJSON);
        fs.writeFileSync(`${path}file.json`, newFile)
    }catch(err){
    }

    return fileJSON;
}

/**
 * @function alterDeviceInDB
 * @param {number} id - The id of the instance to delete
 * @param {Database} database - The Database to delete instance
 * @param {object} manifest - The manifest used to delete all devices relating to instance
 * @param {string} path - A path to write the new file to
 */
async function deleteInstanceFromDB(id, database, manifest, path){
    let {deleteInstance} = require(`${path}electron`);
    let file =  fs.readFileSync(`${path}file.json`);
    let fileJSON = JSON.parse(file);
    let newFileJSON;
    try{
        newFileJSON = await deleteInstance(database, fileJSON, manifest.drivers, id);
        let newFile = JSON.stringify(newFileJSON);
        fs.writeFileSync(`${path}file.json`, newFile)    
    }catch(err){
    
    }

    return newFileJSON
}

module.exports = {
    addDevicesToDB: addDevicesToDB,
    addInstanceToDB: addInstanceToDB,
    alterInstanceInDB: alterInstanceInDB,
    alterDeviceInDB: alterDeviceInDB,
    deleteInstanceFromDB: deleteInstanceFromDB,
    deleteDeviceFromDB: deleteDeviceFromDB
}