import React from "react";
import {VantageObjectReader} from "../../helpers/VantageObjectReader"
import {PhillipsHueObjectReader} from "../../helpers/PhillipsHueObjectReader"
import {LIFXObjectReader} from "../../helpers/LIFXObjectReader";
const fs = require("fs");
export default class InstanceSettings extends React.Component {
    constructor(props){
        super(props);

        this.instanceRefs = [];
        this.newDevicesRefs = [];
        this.newRow = React.createRef();
        this.props.instances.forEach((instance)=>{
            this.instanceRefs.push(React.createRef());
            this.newDevicesRefs.push(React.createRef());
        });
        this.state = {
            event: null
        }
    }

    componentDidMount(){
        let event = this.props.socket.on("updated-file", (file)=>{
            this.props.updateFile(file);
        })

        this.props.socket.on("file-downloaded", (file, instance)=>{
            try{
                let {devices, diagnosticDevices} = VantageObjectReader(file, this.props.map);
                devices.forEach((device)=>{
                    device.instance = instance;
                });
                diagnosticDevices.forEach((diagnosticDevice)=>{
                    diagnosticDevice["instanceId"] = instance.id;
                })
                console.log(instance.id)
                this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices, instance: instance});
            }catch(err){
            }
        })

        this.props.socket.on("hue-devices-returned", (instance, deviceArr)=>{
            let {devices, diagnosticDevices} = PhillipsHueObjectReader(deviceArr);
            devices.forEach((device)=>{
                device.instance = instance;
            })

            diagnosticDevices.forEach((diagnosticDevice)=>{
                diagnosticDevice["instanceId"] = instance.id;
            })
            this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices});
        })

        this.props.socket.on("lifx-devices-returned", (instance, deviceArr)=>{
            let {devices, diagnosticDevices} = LIFXObjectReader(deviceArr);
            devices.forEach((device)=>{
                device.instance = instance;
            })

            diagnosticDevices.forEach((diagnosticDevice)=>{
                diagnosticDevice["instanceId"] = instance.id;
            })
            this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices});
        })

        this.props.socket.on("instance-token", (instance)=>{

        })
        this.setState({
            event: event
        })
    }
    
    componentWillUnmount(){
        this.props.socket.off(this.state.event);
        this.props.socket.off("file-download");

    }
    UNSAFE_componentWillReceiveProps(nextProps){
        this.instanceRefs = [];

        nextProps.instances.forEach((instance)=>{
            this.instanceRefs.push(React.createRef());
            this.newDevicesRefs.push(React.createRef());
        });
    }
    createInstance(event){
        let newRow = this.newRow.current;
        let instance = {
            id: 0,
            address: "",
            port: 0,
            name: "",
            path: "",
            service: "",
            token: "",
            aliases: ""
        }
        for(let cell of newRow.cells){
            switch(cell.id){
                case "address":
                    instance.address = cell.innerText
                    cell.innerText = "";
                    break;
                case "port":
                    instance.port = parseInt(cell.innerText);
                    cell.innerText = "";
                    break;
                case "name":
                    instance.name = cell.innerText;
                    cell.innerText = "";
                    break;
                case "path": 
                    instance.path = cell.innerText;
                    cell.innerText = "";
                    break;
                case "service":
                    instance.service = cell.firstChild.value
                    cell.firstChild.value = "";
                    if(instance.service === "Vantage"){
                        instance.service = "Telnet";
                        instance.port = 3001;
                    }
                    break;
                case "token":
                    instance.token = cell.innerText;
                    cell.innerText = "";
                    break;
                case "aliases":
                    instance.aliases = cell.innerText.split(", ");
                    if(instance.aliases[0] === ""){
                        instance.aliases = [];
                    }
                    cell.innerText = "";
                    break;
                default:
                    
                    break;
            }
        }
        this.props.socket.emit("add-instance-to-db", instance);
        this.download(instance);    
    }
    updateInstance(row){
        let currentRow = row.current;
        let instance = {
            id: 0,
            address: "",
            port: 0,
            name: "",
            path: "",
            service: "",
            token: "",
            aliases: []
        }
        for(let cell of currentRow.cells){
            switch(cell.id){
                case "id":
                    instance.id = currentRow.id
                    break;
                case "address":
                    instance.address = cell.innerText
                    break;
                case "port":
                    instance.port = parseInt(cell.innerText);
                    break;
                case "name":
                    instance.name = cell.innerText;
                    break;
                case "path": 
                    instance.path = cell.innerText;
                    break;
                case "service":
                    instance.service = cell.firstChild.value
                    if(instance.service === "Vantage"){
                        instance.service = "Telnet"
                        instance.port = 3001
                    }
                    
                    break;
                case "token":
                    instance.token = cell.innerText;
                    break;
                case "aliases":
                    instance.aliases = cell.innerText.split(", ");
                    if(instance.aliases[0] === ""){
                        instance.aliases = [];
                    }
                    break;
                default:
                    break;
            }
        }
        this.props.socket.emit("alter-instance", {
            currentInstanceId: currentRow.id,
            instance: instance
        })
    }

    deleteInstance(id){
        this.props.socket.emit("delete-instance", id);
    }

    open(newDevices){
        let devices = newDevices.current;

        devices.click();
    }

    upload(instance, event){
        var file = event.target.files[0];
        
        let document = fs.readFileSync(file.path);
        try{
            let {devices, diagnosticDevices} = VantageObjectReader(document, this.props.map);
            devices.forEach((device)=>{
                device.instance = instance;
            });
            diagnosticDevices.forEach((diagnosticDevice)=>{
                diagnosticDevice["instanceId"] = instance.id;
            })

            this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices, instance: instance});
        }catch(err){
            console.log(err)
        }
    }

    download(instance){
        if(instance.service.toLowerCase() === "telnet" && instance.port === "3001" || instance.service.toLowerCase() === "vantage"){
            this.props.socket.emit("download-file", instance);
        }else{
            this.props.socket.emit("download-file", instance);
        }
    }
    render(){
            return(
                <div className="col-sm-12">
                    <table className="table table-hover mb-0" style={{color: "#fff"}}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Port</th>
                                <th>Service</th>
                                <th>Path</th>
                                <th>Token</th>
                                <th>Aliases</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            {
                                this.props.instances.map((instance, index)=>{
                                    return <tr ref={this.instanceRefs[index]} id={instance.id}>
                                        <td id="name" className="editable-col" contentEditable>{instance.name}</td>
                                        <td id="address" className="editable-col" contentEditable>{instance.address}</td>
                                        <td id="port" className="editable-col" contentEditable>3001</td>
                                        {((instance)=>{
                                            if(instance.service === "Vantage" || (instance.service === "Telnet" && instance.port === 3001)){
                                                return (
                                                    
                                                    <td id="service" className="editable-col" contentEditable>
                                                        <select className="form-control" defaultValue="Vantage">
                                                            <option></option>
                                                            <option>REST</option>
                                                            <option>SOAP</option>
                                                            <option>Telnet</option>
                                                            <option>Vantage</option>
                                                            <option>PhillipsHue</option>
                                                            <option>LIFX</option>
                                                        </select>
                                                    </td>
                                                )
                                            }else{
                                                return(
                                                <td id="service" className="editable-col" contentEditable>
                                                        <select className="form-control" defaultValue={instance.service}>
                                                            <option></option>
                                                            <option>REST</option>
                                                            <option>SOAP</option>
                                                            <option>Telnet</option>
                                                            <option>Vantage</option>
                                                            <option>PhillipsHue</option>
                                                            <option>LIFX</option>
                                                        </select>
                                                    </td>
                                                )
                                            }
                                        })(instance)}
                                        
                                        <td id="path" className="editable-col" contentEditable>{instance.path}</td>
                                        <td id="token" className="editable-col" contentEditable>{instance.token}</td>
                                        <td id="aliases" className="editable-col" contentEditable>{instance.aliases.map((alias, index, array)=>{
                                            if(index == array.length-1){
                                                return alias
                                            }else{
                                                return `${alias}, `
                                            }
                                        })}</td>
                                        <td>
                                            <span className="fa fa-upload font-button" title="Upload Devices" onClick={this.open.bind(this, this.newDevicesRefs[index])}><input style={{display: "none"}} ref={this.newDevicesRefs[index]} id = "upload-devices" type="file" name="newfile" onChange={this.upload.bind(this, instance)} accept=".dc"/></span>
                                            <span className="fa fa-download font-button" title="Download Devices" onClick={this.download.bind(this, instance)}></span>
                                            <span title="Update Instance" onClick={this.updateInstance.bind(this, this.instanceRefs[index])} className="fa fa-pencil-square font-button"></span>
                                            <span title="Delete Instance" onClick={this.deleteInstance.bind(this, instance.id)}className="fa fa-minus-square font-button"></span></td>
                                    </tr>
                                })
                            }
                            <tr ref={this.newRow}>
                                <td id="name" className="editable-col" contentEditable></td>
                                <td id="address" className="editable-col" contentEditable></td>
                                <td id="port" className="editable-col" contentEditable></td>
                                <td id="service" className="editable-col">
                                    <select className="form-control">
                                        <option></option>
                                        <option>REST</option>
                                        <option>SOAP</option>
                                        <option>Telnet</option>
                                        <option>Vantage</option>
                                        <option>PhillipsHue</option>
                                        <option>LIFX</option>
                                    </select>
                                </td>
                                <td id="path" className="editable-col" contentEditable></td>
                                <td id="token" className="editable-col" contentEditable></td>
                                <td id="aliases" className="editable-col" contentEditable></td>
                                <td>
                                    <span onClick={this.createInstance.bind(this)} title="Add Instance" className="fa fa-plus-square font-button"></span>
                                </td>
                            </tr>
                    </table>
                </div>
            )
    }
}