export const LIFXObjectReader = (deviceArr)=>{
    let devices = [];
    let diagnosticDevices = [];
    for(const device of deviceArr){
        devices.push(createDevice(device));
        diagnosticDevices.push(createDiagnosticDevice(device));
    }

    return {
        devices: devices,
        diagnosticDevices: diagnosticDevices
    }
}

const createDevice = (props)=>{
    let device = {
        id: props.id,
        name: props.label,
        mapTo: "LIFXLoad"
    }

    return device;
}

const createDiagnosticDevice = (props)=>{
    let device = {
        id: props.id,
        name: props.label,
        type: props.product.identifier,
        online: props.connected
    }
    return device;
}   