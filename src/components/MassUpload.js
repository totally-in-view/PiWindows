import React from "react";
import Panel from "./Panel";
import {VantageObjectReader} from "./VantageObjectReader";

export default class MassUpload extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            instances: []
        }
    }
    componentDidMount(){
        this.props.socket.on("instances-added", (instances)=>{
            this.setState({
                instances: instances
            })
        });
    }
    uploadInstances(event){
        let reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = ()=>{
            this.props.socket.emit("add-instances-to-db", reader.result);
        }
    }
    addDevices(instance, event){
        console.log(instance)

        let reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = ()=>{
            console.log(reader.result)
            let {devices, diagnosticDevices} = VantageObjectReader(reader.result);
            devices.forEach((device)=>{
                device.instance = instance;
            });
             diagnosticDevices.forEach((diagnosticDevice)=>{
                diagnosticDevice["instanceId"] = instance.id;
            });
            console.log(diagnosticDevices);
            this.props.socket.emit("addDevicesToDB", {devices: devices, diagnosticDevices: diagnosticDevices});
        }
        
    }
    render(){
        console.log(this.state.instances);
        return(
            <Panel header={"Upload Instances"} body={
                <div>
                    <div className="row">
                        <div className="col-sm-12">
                            <label className="control-label mb-10">Upload CSV of Instances</label>
                            <div style={{padding: "10px", display: "flex", justifyContent: "flex-start", alignItems: "center"}}>
                                <div className="file-uploader">
                                    <button className="btn btn-success btn-outline fancy-button btn-0" >Upload</button>
                                    <input type="file" accept=".csv" onChange={this.uploadInstances.bind(this)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {this.state.instances.map((instance)=>{
                        return <div className="row">
                                    <div className="col-sm-12">
                                    <label className="control-label mb-10">{instance.name}</label>
                                    <div style={{padding: "10px", display: "flex", justifyContent: "flex-start", alignItems: "center"}}>
                                        <div className="file-uploader">
                                            <button className="btn btn-danger btn-outline fancy-button btn-0">Add Devices</button>
                                            <input type="file" accept=".dc" onChange={this.addDevices.bind(this, instance)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                    })}
                </div>
            }/>
        )
    }
}