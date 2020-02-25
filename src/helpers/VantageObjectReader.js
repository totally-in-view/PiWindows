const PROPS = {
  "serialnumber": "SerialNumber",
  "loadtype": "LoadType",
  "contractornumber": "ContractorNumber",
  "nodeid": "NodeID",
  "bus": "Bus",
  "port": "Port",
  "hostname": "HostName",
  "ipaddress": "IPAddress",
  "dinmodules": "DinModules",
  "parent": "Parent",
  "parentposition": "ParentPosition",
  "up": "Up",
  "down": "Down",
  "hold": "Hold",
  "vacancytask": "VacancyTask",
  "occupancytask": "OccupancyTask",
  "number": "Number",
  "model": "Model",
  "time": "Time",
  "slaveid": "slaveId"
}

const ATTRIBUTES = {
  "master": "Master",
  "setpoint": "Setpoint"
}

export const VantageObjectReader = (file, map)=>{
    var parser = new DOMParser();
    var doc = parser.parseFromString(file, "application/xml");
    var objects =  doc.getElementsByTagName("Objects")[0];
    var objectArr = objects.getElementsByTagName("Object");
    var areas = new Map();
    var sceneAreas = new Map();
    var phantomAreas = new Map();
    let diagnosticDevices = []
    let devices = [];
      for(var i = 0; i < objectArr.length; i++){
        var tagName = objectArr[i].children[0].tagName;
        let deviceMap = findType(tagName, map);
        let device;
        let diagnosticDevice;
        if(deviceMap != null){
          let res = scrapTree(objectArr[i].children[0], deviceMap);
          device = res.device;
          diagnosticDevice = res.diagnostic;
        if(device != undefined){
          if(device.type.includes("Thermostat")){
            let coolVid = 0;
            let heatVid = 0;
            let roomVid = 0;
            for(var j = i; j < objectArr.length; j++){
              let obj = objectArr[j];

              if(obj.children[0].tagName == "Temperature"){
                let temp = obj.children[0];
                if(temp.hasAttribute("Setpoint")){
                  switch(temp.getAttribute("Setpoint")){
                    case "Cool":
                      coolVid = parseInt(temp.getAttribute("VID"));
                      break;
                    case "Heat":
                      heatVid = parseInt(temp.getAttribute("VID"));
                      break;
                    default:
                      break;
                  }
                }else{
                  roomVid = parseInt(temp.getAttribute("VID"));
                }
              }
              if(coolVid != 0 && heatVid != 0 && roomVid != 0){
                break;
              }
            }
           device = {
             ...device,
             coolId: coolVid,
             heatId: heatVid,
             roomId: roomVid,
            };
            devices.push(device);
          }
          else if(device.type.includes("Area")){
            areas.set(device.id, device.name);
          }
          else if(device.type == "EqCtrl" || device.type == "Dimmer" || device.type == "Keypad" || 
                  device.type == "EqUX" || device.type == "MockLCD" || device.type == "TPT" || 
                  device.type == "IRZone" || device.type == "DualRelayStation"){
            
            devices.push(device)
          }
          else if(device.type == "Button"){
            
            var phantom = false;

            if(phantomAreas.has(device.parent)){
              phantom = true 
            }
              if(phantom == true){
                device.area = phantomAreas.get(device.parent);
              }else{
                device.area = sceneAreas.get(device.parent);
              }
                devices.push(device);
            }else{
              devices.push({...device});
            }   
          }
          if(diagnosticDevice.bus != null){
            let bus = diagnosticDevices.find(dDevice =>{
              return dDevice.id == diagnosticDevice.bus
            });
            try{
              diagnosticDevice.bustype = bus.type
            }catch(err){

            }
          }
          if(diagnosticDevice.parent != null){
            let parent = diagnosticDevices.find(dDevice =>{
              return dDevice.id == diagnosticDevice.parent
            });
            try{
              diagnosticDevice.parenttype = parent.type
            }catch(err){
            }
          }

          if(diagnosticDevice.type == "Task"){
            let task = objectArr[i].children[0]
            diagnosticDevice.params = [];
            let paramtables = task.getElementsByTagName("ParamTable");
            try{
              for(var k = 0; k < paramtables.length; k++){
                let paramtable = paramtables[k];
                let params = paramtable.getElementsByTagName("Param");
                for(var param = 0; param < params.length; param++){
                  let paramInfo = params[param];
                  if(paramInfo.getAttribute("Fixed") != "true"){
                    let paramArr = paramInfo.getElementsByTagName("array");
                    if(paramArr.length > 0){
                      for(var val = 0; val < paramArr.length; val++){
                        let parameterValues = paramArr[val].children
                        for(var child = 0; child < parameterValues.length; child++){
                          diagnosticDevice.params.push(parameterValues[child].innerHTML);
                        }
                        
                      }
                    }
                  }
                }
              }
            }catch(err){
            }
          }

          if(diagnosticDevice.type == "Timer"){
            let timer = objectArr[i].children[0];
            let scenes = objects.getElementsByTagName("Scene");
            let _module;
            try{
              for(let j = 0; j < scenes.length; j++){              
                let scene = scenes[j];
                let name = scene.getElementsByTagName("Name")[0].innerHTML;
                let constants = scene.getElementsByTagName("Initializer")[0].getElementsByTagName("Constant");
                let tasks = [];
                for(let k = 0; k < constants.length; k++){
                  tasks[k] = constants[k].innerHTML;
                }
                if(name.includes(diagnosticDevice.time)){
                  diagnosticDevice.eventObjects = tasks
                  break;
                }

            }
            let weekly = timer.getElementsByTagName("Weekly")[0];
            let interval = weekly.getElementsByTagName("Interval")[0].innerHTML;
            let weekdays = weekly.getElementsByTagName("WeekDay");
            let time = weekly.getElementsByTagName("Time")[0].innerHTML
            let days = [];

            for(let j = 0; j < weekdays.length; j++){
              let day = weekdays[j].innerHTML
              days.push(day);
            }
            diagnosticDevice.eventInterval = interval;
            diagnosticDevice.eventDays = days;
            diagnosticDevice.eventTime = time;
            
            }catch(err){

            }
          }

          if(diagnosticDevice.type == "Master"){
          }
          diagnosticDevices.push(diagnosticDevice);
        }
      } 
      devices.forEach((device)=>{
        if(device.parent != null && device.area == null){
          
          try{
            let parent = diagnosticDevices.find(item => {
              return item.id == device.parent
            });
            device.area = areas.get(parent.area);
          }catch(err){
          }
        }else{
          device.area = areas.get(device.area);
        }
        
      })
      return {
        devices: devices,
        diagnosticDevices: diagnosticDevices
      }
}

function findType(type, parent){
  let index;
  try{
    index = parent.find(item=>{
      return item.type == type
    });
  }catch(err){

  }
  
  if(index == null){
      for(const node of parent){
        if(node.children != null){
          let childNode = findType(type, node.children);
          if(childNode != null){
            index = childNode;
            break;
          }
        }
      }
  }
  
  return index;
}

function scrapTree(docTree, tree){
  let diagnosticInfo = {};
  let device;

  if(docTree.tagName == tree.type){
    let name, vid, area, parent;
    try{
      name = docTree.getElementsByTagName("Name")[0].innerHTML;
    }catch(err){

    }try{
      vid = docTree.getAttribute("VID");
    }catch(err){

    }
    try{
      area = docTree.getElementsByTagName("Area")[0].innerHTML;
    }catch(err){
    }
    if(name.trim() == ""){
      try{
        name = docTree.getElementsByTagName("Text")[0].innerHTML;

      }catch(err){

      }
    }
    try{
     
      let parentDoc = docTree.getElementsByTagName("Parent")
      if(parentDoc != undefined){
        if(tree.type == "Button"){
        }
        parent = parentDoc[0].innerHTML
        }
      }catch(err){
      }
    if(tree.mapTo != null){
      device = {
        name: name,
        id: vid,
        type: tree.type,
        parent: parent,
        area: area,
        mapTo: tree.mapTo
      }
    }
    diagnosticInfo = {
      name: name,
      id: vid,
      type: tree.type,
      parent: parent,
      area: area  
    }
    if(tree.props.length > 0){
      tree.props.forEach((prop)=>{
        let docProp = PROPS[prop];
        let propInfo;
        if(prop == "parentposition"){
          
          try{
            let positionAttr = docTree.getElementsByTagName("Parent")[0].attributes[0].name
            if(positionAttr.toLowerCase() === "position"){
              propInfo = docTree.getElementsByTagName("Parent")[0].attributes[0].value;
              diagnosticInfo[prop] = propInfo;
            }
            
          }catch(err){
          }
          }else{
        propInfo = docTree.getElementsByTagName(docProp);
        if(propInfo != null){
          if(propInfo[0] != null){
            diagnosticInfo[prop] = propInfo[0].innerHTML
            if(prop == "bus"){
              diagnosticInfo["bustype"] = ""
            }
            if(prop == "parent"){
              diagnosticInfo["parenttype"] = ""
            }
            
          }else{
          }
        }
      }
      });
    }
    if(tree.attributes.length > 0){
      tree.attributes.forEach((attribute)=>{
        let docAttr = ATTRIBUTES[attribute];
        if(docTree.hasAttribute(docAttr)){
          diagnosticInfo[attribute] = docTree.getAttribute(docAttr);
        }
      });
    }
    if(tree.children != null){
      if(tree.children.length >0){

      }
    }
  }
  if(device == null){
    return {
      diagnostic: diagnosticInfo
    }
  }else{
    return {
      device: device,
      diagnostic: diagnosticInfo
    }
  }
}