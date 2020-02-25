/**
 * @function findDevice
 * @param {Array} devices 
 * @param {string} type 
 * @param {number} id
 * @description Takes array of devices, and if the type of the device and the id of the device match specifications, that device will be returned
 * @returns {object} 
 */
function findDevice(devices, type, id){
    let phoenixDevice;

    devices.forEach((device)=>{
        if(device.props.type.toLowerCase() == type && device.props.id == id){
            phoenixDevice = device;
        }
    });
    return phoenixDevice;
}

/**
 * @function bindingDevice
 * @param {object} device 
 * @param {Array} drivers
 * @description Loops through all drivers and binds Vantage Device to PI Driver.
 * @returns {object} 
 */
function bindingDevice(device, drivers){

    let driver = drivers.find((driver)=>{
        return driver.props.type == device.mapTo
    })
    if(driver != null){
        device.area = device.area == null ? driver.props.area : device.area
        device.name = device.area == null ? driver.props.name : device.name
        return {
            ...driver,
            props: {
                ...driver.props,
                id: device.id,
                name: device.name,
                area: device.area,
                instanceId: {...device.instance}
            },
            functions: driver.functions.copyWithin()
        }
    }
    
    if(device.props != null){
        driver = drivers.find((driver)=>{
            return driver.props.type == device.props.type
        })
        return {
            ...driver,
            props: {
                ...driver.props,
                id: device.props.id,
                name: device.props.name,
                area: device.props.area,
                instanceId: {...device.props.instanceId},
                instanceAlias: device.props.instanceAlias
            },
            functions: driver.functions.copyWithin()
        }
    }
}
/**
 * @function getDevicesFromDatabase
 * @param {Array} phoenixDevices 
 * @param {object} area 
 * @description Returns devices that are tied to area. Returns it in format that front-end could understand
 */
async function getDevicesFromDatabase(phoenixDevices, area=null, alias=null){
    var devices = new Map();
    for(const phoenixDevice of phoenixDevices){
            if(area.name == phoenixDevice.props.area && area.instanceId == phoenixDevice.props.instanceId.id){
            if(alias != null){
                if(phoenixDevice.props.instanceAlias == alias){
                    if(phoenixDevice.props.alias != null){
                        if(!devices.has(phoenixDevice.props.alias)){
                            devices.set(phoenixDevice.props.alias, [phoenixDevice]);
                        }
                        else{
                            let aliasArray = devices.get(phoenixDevice.props.alias);
                            aliasArray.push(phoenixDevice);
                            devices.set(phoenixDevice.props.alias, aliasArray);
                        }
                    }
                    else{
                        
                    }
                }
            }else{
                if(phoenixDevice.props.alias != null){
                    if(!devices.has(phoenixDevice.props.alias)){
                        devices.set(phoenixDevice.props.alias, [phoenixDevice]);
                    }
                    else{
                        let aliasArray = devices.get(phoenixDevice.props.alias);
                        aliasArray.push(phoenixDevice);
                        devices.set(phoenixDevice.props.alias, aliasArray);
                    }
                }else{ 
                }
        }
    }
   
}
if(devices.size == 0){
    return null
}
return {
    name: area.name,
    widgetsRight: [],
    widgetsLeft: [],
    view: "", 
    active: false,
    devices: Array.from(devices)
};
}

module.exports = {
    findDevice: findDevice,
    getDevicesFromDatabase: getDevicesFromDatabase,
    bindingDevice: bindingDevice
}