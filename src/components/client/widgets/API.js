const genAPICall = (type, id, functionName, parameters = null)=>{
    var deviceType = type.toLowerCase().replace("_", "");
    var api = `${deviceType}_${id}_${functionName}`;
    if(parameters !== null){
        parameters.forEach((param)=>{
            api += `_${param}`
        });
    }
    

    return api;
}

export {genAPICall};