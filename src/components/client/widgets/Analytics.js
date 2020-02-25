import React from "react";
import {Index} from "./index"
export default class Analytics extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            devices: this.props.devices
        }
    }
    render(){
        let lights = [];
        let thermostats = [];

        this.state.devices.forEach((device)=>{
            if(device.props.alias === "Light"){
                lights.push(device)
            }else if(device.props.alias === "Thermostat"){
                thermostats.push(device);
            }
        })
        return(
            <div>
                <div style={{display: "flex", flexFlow: "row wrap", justifyContent: "space-around"}}>
                    {this.state.devices.map((device)=>{
                        if(device.props.type.toLowerCase().includes("load") && !device.props.alias.toLowerCase().includes("color")){
                            return <Index.LightDonut lights={[device]} socket={this.props.socket} permissions={this.props.permissions}/>
                        }else if(device.props.type.toLowerCase().includes("hvac")){
                            return <Index.TempDonut thermostats={[device]} socket={this.props.socket} permissions={this.props.permissions}/>
                        }
                    })}
                </div>
                <div style={{dispaly: "flex", flexFlow: "row wrap", justifyContent: "space-between"}}>
                    {((lights)=>{
                        if(lights.length > 0){
                            return <div style={{display:"inline-block", margin: "10px", width: "45%"}}><Index.Chart socket={this.props.socket} type={"Light"} permissions={this.props.permissions} instanceId={this.props.id} devices={lights} /></div>
                        }
                    })(lights)}
                    {((thermostats)=>{
                        if(thermostats.length > 0){
                            return <div style={{display:"inline-block", margin: "10px", width: "45%"}}><Index.Chart socket={this.props.socket} type={"Thermostat"} permissions={this.props.permissions} instanceId={this.props.id} devices={thermostats} /></div>
                        }
                    })(thermostats)}
                </div>
                <div style={{display: "flex", flexFlow: "row wrap", justifyContent: "space-between"}}>{this.state.devices.map((device)=>{
                    if(device.props.widget === "LightingWidget"){
                        return <Index.LightingWidget properties={device.props} functions={device.functions} socket={this.props.socket} permissions={this.props.permissions} />
                    }
                    if(device.props.widget === "HVACWidget"){
                        return <Index.HVACWidget properties={device.props} functions={device.functions} socket={this.props.socket} permissions={this.props.permissions} />
                    }
                    if(device.props.widget === "SceneButton"){
                        return <Index.Scene properties={device.props} functions={device.functions} socket={this.props.socket} permissions={this.props.permissions} />
                    }
                    if(device.props.widget === "ShadeWidget"){
                        return <Index.ShadeWidget properties={device.props} functions={device.functions} socket={this.props.socket} permissions={this.props.permissions} />
                    }
                    if(device.props.widget === "ColorLightingWidget"){
                        return <Index.ColorLightingWidget properties={device.props} functions={device.functions} socket={this.props.socket} />
                    }
                })}</div>
            </div>
        )
    }
}