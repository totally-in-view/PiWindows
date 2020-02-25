import React from "react";
import Panel from "./Panel";
import Form from "./Form";
import Wizard from "./Wizard";
import DriverBinder from "./DriverBinder";
import LoadScreen from "./LoadScreen";
//React Router
import {Route, Redirect, withRouter} from "react-router-dom";

//REDUX
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {assignInstance, initializeDevices, changeOrigin, openDriverBinder, closeDriverBinder, getDrivers, selectDevice, removeDevice, bindDevice, loading} from "../store/actions/index";

import {VantageObjectReader} from "./VantageObjectReader";

// // Electron
// const electron = window.require("electron");
// const ipcRenderer = electron.ipcRenderer;
const fs = window.require("fs");

class AddDevice extends React.Component {
    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this)
    }
    componentDidMount(){
        console.log(fs);
        console.log(this.props);
        this.props.socket.emit("get-drivers");
        this.props.socket.on("file-returned", (data)=>{
            console.log(data.file);
            var devices = VantageObjectReader(data.file, this.props.map);
            devices.forEach((device)=>{
                device.instance = {...data.instance};
            })

            this.props.socket.emit("addDevicesToDB", devices);
          })

        this.props.socket.on("driversReturned", (drivers)=>{
            this.props.getDrivers(drivers);
        })

        this.props.socket.on("devices-returned", (data)=>{
            console.log(data);
        })

        this.props.socket.on("to-review-page", ()=>{
            this.props.redirect({redirect: true, view: <Redirect to={`/add-device/instance`} />})
        })
    }
    handleSubmit(stepName, event){
        event.preventDefault();
        console.log("Form Submitted!");

        var instance = this.props.deviceeditor.currentInstance;

        if(stepName == "From Instance"){
            for(var i = 0; i < event.target.length; i ++){
                var input = event.target[i];

                if(input.name == "Web Service"){
                    this.props.instances.forEach((instance)=>{
                        if(`${instance.name} - ${instance.id}` == input.value){
                            this.props.assignInstance(instance, <Redirect to="/add-device/configurations"/>);
                        }
                    })
                }
            }
        }
        if(stepName == "Configurations"){
            console.log(event.target);

            for(var i = 0; i < event.target.length; i ++){
                var input = event.target[i];


                if(instance.service == "REST" ){

                    if(input.type == "radio"){
                        if(input.checked == true){
                            instance["token-type"] = input.value
                        }
                    }
                    if(input.name == "Content-Type"){
                        instance["header"] = {
                            "Content-Type": `application/${input.value.toLowerCase()}`
                        }
                    }
                            
                    if(input.name == "Path"){
                        console.log(instance.path);
                        instance["paths"] = [ input.value ]; 
                    }
                }   
            }
            this.props.socket.emit("get-file", instance);
        }

        
        }
    
    changeDeviceOrigin(event){
        this.props.changeOrigin(event.target.name);
    }


    handleSelectChange(event){
       if(event.target.name == "From Instance"){
            this.props.instances.forEach((instance)=>{
                if(`${instance.name} - ${instance.id}` == event.target.value){
                    var serviceFields
                    if(instance.service == "REST"){
                        serviceFields = <div>
                                            <div className="form-group">
                                                <label className="control-label mb-10 text-left">Path</label>
                                                <input type="text" name="Path" className="form-control" defaultValue="" required/>
                                            </div>
                                            <div>
                                            <div className="form-group">
                                                <label className="control-label mb-10 text-left">Content Type</label>
                                                <select name="Content-Type" className="form-control" defaultValue="" required>
                                                    <option></option>
                                                    <option>JSON</option>
                                                    <option>XML</option>
                                                    <option>Plain Text</option>
                                                </select>
                                            </div>
                                            </div>
                                        </div>;
                    }
                    else if(instance.service == "Telnet"){
                        serviceFields = <div className="form-group">
                                            <label className="control-label mb-10 text-left">Command</label>
                                            <input type="text" name="command" className="form-control" defaultValue="" required/>
                                        </div>;       
                    }
                    this.props.assignInstance(instance, serviceFields);
                }
            });
       }else if(event.target.name == "Web Service"){
        this.props.instances.forEach((instance)=>{
            if(`${instance.name} - ${instance.id}` == event.target.value){
                if(instance.service == "Telnet"){
                    console.log("Getting File...")
                    this.props.assignInstance(instance, <LoadScreen/>);
                    this.props.socket.emit("get-file", instance);
                }
            }
        })
            
       }
       else if(event.target.name == "Bind to Instance"){
        this.props.instances.forEach((instance)=>{
            if(`${instance.name} - ${instance.id}` == event.target.value){
                this.props.assignInstance(instance);
            }
        })
       }
        
    }

    formCallBack(info){
            if(this.state.config.has(info)){
            this.setState((prevState,prop)=>({
                currentconfig: prevState.config.get(info)
            }));
        }
    }

    open(event){
        var reader = new FileReader();
        var file = event.target.files[0];
        console.log(file);
        
        let document = fs.readFileSync(file.path);
        console.log(Buffer.from(document).toString("utf8"));
        try{
                let {devices, diagnosticDevices} = VantageObjectReader(document, this.props.map);
                devices.forEach((device)=>{
                    device.instance = this.props.deviceeditor.currentInstance;
                });
                diagnosticDevices.forEach((diagnosticDevice)=>{
                    diagnosticDevice["instanceId"] = this.props.deviceeditor.currentInstance.id;
                })
                this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices});
            }catch(err){
                console.log(err)
            }
        }
    
      bindDeviceToDriver(){

      }

      bindDevicesToDriver(devices, event){
          event.preventDefault();
        this.props.openDriverBinder(true, null);
        
      }

    addDeviceToBind(device, event){
          if(event.target.checked == true){
              this.props.selectDevice(device);
          }
          else if(event.target.checked == false){
                this.props.removeDevice(device)
          }
    }
    
    render(){
        var instanceOpts = [];
        var serviceFields = [];
        if(this.props.instances != null){
            this.props.instances.forEach((instance)=>{
                instanceOpts.push(<option>{instance.name} - {instance.id}</option>)
            });
        }
        
        return(
            
            <div>
                <Redirect to="/add-device/instance"/>
            
                <Route path="/add-device/instance" exact render={(props)=>{
                    
                    var steps = [
                        {name: "From Instance", active:"active"},
                        {name: "Configurations", active:"disabled"},
                        {name: "Review", active:"disabled"}
                    ]
                
                    return(
                        <Panel header={"Add Devices"} body={
                            // <Wizard steps={steps} submit={this.handleSubmit.bind(this, "From Instance")} body={
                                
                                <div className="form-wrap">
                                <div className="row">
                                <div className="col-sm-12">
                                <div className="form-group">
                                <label className="control-label mb-10 text-left">From Web Service</label>
                                <select className="form-control" name="Web Service" onChange={this.handleSelectChange.bind(this)} required>
                                    <option></option>
                                    {instanceOpts}
                                </select>
                                </div>
                                </div>
                                </div>
                                <div className="dividing-line"/>
                                <div className="row">
                                <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="control-label mb-10 text-left">Bind to Instance</label>
                                    <select className="form-control" name="Bind to Instance" onChange={this.handleSelectChange.bind(this)} required>
                                        <option></option>
                                        {instanceOpts}
                                    </select>
                                </div>
                                </div>
                                
                                <div className="col-sm-6" style={{display: "flex", flexFlow: "column"}}>
                                    <label className="control-label mb-10 text-left">From File</label>
                                    <div className="file-uploader">
                                        <button className="btn btn-success btn-outline fancy-button btn-0">Open</button>
                                        <input type="file" name="newfile" onChange={this.open.bind(this)}/>
                                    </div>
                                </div>                                                        
                                </div>
                                </div>
                            }/>
            //             }/>
                    )
                }
            }/>
            
            
            {/* <Route path="/add-device/configurations" exact render={(props)=>{
                    
                    var steps = [
                        {name: "From Instance", active:"disabled"},
                        {name: "Configurations", active:"active"},
                        {name: "Review", active:"disabled"}
                    ]
                    console.log(this.props.deviceeditor);
                    var fields = [];
                    var view;
                    if(this.props.deviceeditor.currentInstance.service == "REST"){
                        fields.push(<div className="auth-radios">
                                    <div className="radio radio-primary">
                                        <input type="radio" name="radio" id="radio3" value="bear" />
                                        <label for="auth" style={{color: "#fff"}}> Bear Token Authentication </label>
                                    </div>
                                    <div className="radio radio-primary">
                                        <input type="radio" name="radio" id="radio3" value="path" />
                                        <label for="auth" style={{color: "#fff"}}> Token Path </label>
                                    </div>
                                    </div>);
                        fields.push(
                                    <div className="form-group">
                                        <label className="control-label mb-10 text-left">Path</label>
                                        <input type="text" name="Path" className="form-control" defaultValue="" required/>
                                    </div>
                                    );
                        fields.push(
                                <div className="form-group">
                                    <label className="control-label mb-10 text-left">Content Type</label>
                                    <select name="Content-Type" className="form-control" defaultValue="" required>
                                        <option></option>
                                        <option>JSON</option>
                                        <option>XML</option>
                                        <option>Plain Text</option>
                                    </select>
                                </div>);
                    }
                    else if(this.props.deviceeditor.currentInstance.service == "Telnet"){
                        var devicesUI = []

                        this.props.deviceeditor.devices.forEach((device)=>{
                            devicesUI.push(<div key={device.vid}>
                                             <input className="device-from-processor"name={device.vid} type="checkbox" onChange={this.addDeviceToBind.bind(this, device)}/>{device.name}
                                            </div>)

                            })
                        
                        fields.push(
                            <div className="telnet-devices">
                                <div className="devices-from-processor">
                                    <div>
                                        <input className="device-from-processor" type="checkbox" onChange={this.addDeviceToBind.bind(this, this.props.deviceeditor.devices)}/>All Devices
                                    </div> 
                                    {devicesUI}
                                   
                                </div>

                                 <div className="btn btn-success"  onClick={this.props.openDriverBinder.bind(this, true, <DriverBinder devices={this.props.deviceeditor.devicesSelected} drivers = {this.props.deviceeditor.drivers} instances={this.props.instances} close={this.props.closeDriverBinder} add={this.props.add}/>)}>Bind Devices To Driver</div>
                                 {/* <div className="btn btn-success" onClick={this.props.openDriverBinder.bind(this, true, <DriverBinder devices={this.props.deviceeditor.devices} drivers = {this.props.deviceeditor.drivers} instances={this.props.instances} close={this.props.closeDriverBinder} add={this.props.add}/>)}>Bind All Devices To Driver</div> */}
                            {/* </div>)
                    }

                  return (
                        <Panel header={"Add Devices"} body={
                            <Wizard steps={steps} submit={this.handleSubmit.bind(this, "Configurations")} body={
                                
                                <div className="form-wrap">
                                    {this.props.deviceeditor.view}
                                    <div className="form-group">
                                        {fields}
                                    </div>
                                </div>
                            }/>
                        }/>
                    )
                    }
                }/>

                <Route path="/add-device/review" exact render={(props)=>{
                    
                    var steps = [
                        {name: "From Instance", active:"disabled"},
                        {name: "Configurations", active:"disabled"},
                        {name: "Review", active:"active"}
                    ]
                    return (
                        <Panel header={"Add Devices"} body={
                            <Wizard steps={steps} submit={this.handleSubmit.bind(this, "Review")} body={
                                <div className="form-wrap">
                                    <div className="form-group">
                                    <label className="control-label mb-10 text-left">Finished!</label>
                                    </div>
                                </div>
                            }/>
                        }/>
                    )
                    }
                }/>  */}
            </div>
        );
    }

}


AddDevice.defaultProps = {
    fields: [
        {
            label: "Driver",
            type: "select",
            options: [
                "Load", 
                "HVAC",
                "Shade",
                "AV"
            ]
        },
        {
            label: "Name",
            type: "text"
        },
        {
            label: "ID",
            type: "text"
        },
        {
            label: "Instance ID",
            type:"select",
            options: [
                "Instance 1",
                "Instance 2",
            ]
        },
        {
            type: "checkbox",
            configurations: {
                Load: [
                    "Dimmable",
                    "RGB",
                    "RGBW",
                    "RGBA"
                ],
                HVAC: [
                    "Some HVAC Config"
                ],
                Shade: [
                    "Some Shades Config"
                ],
                AV: [
                    "Some AV Config"
                ]
            }
        
        }
    ],
        
}

const mapDispatchToProps =  dispatch =>{
    return bindActionCreators({
        assignInstance: assignInstance,
        initializeDevices: initializeDevices,
        changeOrigin: changeOrigin,
        openDriverBinder: openDriverBinder,
        closeDriverBinder: closeDriverBinder,
        getDrivers: getDrivers,
        selectDevice: selectDevice,
        removeDevice: removeDevice,
        bindDevice: bindDevice,
        loading: loading
    }, dispatch);
}

const mapStateToProps = state =>{
    return{
        deviceeditor: state.deviceEditor
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddDevice));