export const PhillipsHueObjectReader = (deviceArr)=>{
    let devices = [];
    let diagnosticDevices = [];
    let ids = Object.keys(deviceArr);

    for(const id of ids){
        let device = createDevice(id, deviceArr[id])
        let diagnosticDevice = createDiagnosticDevice(id, deviceArr[id]);

        devices.push(device);
        diagnosticDevices.push(diagnosticDevice);
    }

    return {
        devices: devices, 
        diagnosticDevices: diagnosticDevices
    }
}


const createDevice = (id, props)=>{
    let device = {
        id: id,
        name: props.name,
        mapTo: "PhillipsHueLoad"
    }
    return device;
}

const createDiagnosticDevice = (id, props)=>{
    let device = {
        id: id,
        name: props.name,
        type: "PhillipsHueLoad",
        online: props.state.reachable,
        modelId: props.modelid,
        version: props.swversion
    }

    return device
}