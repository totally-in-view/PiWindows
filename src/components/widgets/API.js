const genAPICall = (type, id, functionName, parameters)=>{
    var deviceType = type.toLowerCase().replace("_", "");
    var api = `${deviceType}_${id}_${functionName}`;

    parameters.forEach((param)=>{
        api += `_${param}`
    });

    return api;
}

export {genAPICall};