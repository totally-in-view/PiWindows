import React from "react";
import {genAPICall} from "./API";
export default class LightDonut extends React.Component {
    constructor(props){
        super(props);

        this.props.lights.forEach((light)=>{
            light.functions.forEach((funct)=>{
                if(funct.name === "status"){
                    let apiCall = genAPICall(light.props.type, light.props.id, funct.name);
                    this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: light.props.instanceId});
                }
            });
        })
        if(this.props.permissions === "analytics"){
            this.props.socket.emit("get-light-color", this.props.lights[0]);
        }
        this.state = {
            lights: this.props.lights,
            lightsOn: [],
            lightsOff: [],
            listeners: [],
            color: null
        }
    }
    
    componentWillReceiveProps(props){
        let lightsOn = [];
        let lightsOff = [];
        let listeners = []

        if(props.permissions === "client"){
                props.lights.forEach((light)=>{
                    let lightEvent = `${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_res`
                    listeners.push(lightEvent);
                    light.functions.forEach((funct)=>{
                        if(funct.name === "status"){
                            let apiCall = genAPICall(light.props.type, light.props.id, funct.name);
                            props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: light.props.instanceId});
                        }
                    });
                })
                lightsOn = [];
                lightsOff = [];
        }
        else if(props.permissions === "analytics"){
            props.socket.emit("get-light-color", props.lights[0])
            if(props.alias !== this.props.alias || this.props.instance !== props.instance){
                props.lights.forEach((light)=>{
                    
                    if(light.props.level > 0){
                        let onIndex = lightsOn.findIndex(index=>{
                            return index.props.id === light.props.id && index.props.type === light.props.type && light.props.instanceId.id === index.props.instanceId.id
                        })
                        if(onIndex === -1){
                            lightsOn.push(light);
                            lightsOff = lightsOff.filter(index=>{
                                return index.props.id === light.props.id && index.props.type === light.props.type && light.props.instanceId.id === index.props.instanceId.id
                            });
                        }
                    }else{
                        let offIndex = lightsOff.findIndex(index=>{
                            return index.props.id === light.props.id && index.props.type === light.props.type && light.props.instanceId.id === index.props.instanceId.id
                        })
                        if(offIndex === -1){
                            lightsOff.push(light);
                            lightsOn = lightsOn.filter(index=>{
                                return index.props.id === light.props.id && index.props.type === light.props.type && light.props.instanceId.id === index.props.instanceId.id
                            });
                        }
                    }
                })
            }
        }

        for(let listener of this.state.listeners){
            props.socket.removeListener(listener);
        }
        this.setState({
            lights: props.lights,
            listeners: listeners,
            lightsOn: [],
            lightsOff: []
        })
    }
    componentDidMount(){
        let listeners = []
        let instanceId = this.state.lights[0].props.instanceId.id;
        this.props.socket.on(`${instanceId}_light_donut_event`, (device, data)=>{
            let light = this.state.lights.find((stateLight)=>{
                return `${stateLight.props.instanceId.id}_${stateLight.props.type.toLowerCase()}_${stateLight.props.id}_res` == device
            })
            if(light != null){
                let id = light.props.id;
                let type = light.props.type;
                let level = parseInt(data).toFixed(0);
                let lightsOff = this.state.lightsOff;
                let lightsOn = this.state.lightsOn;
                let lightInArea = true;
                if(data !== null){
                    if(lightInArea === true){
                        if(level == 0){    
                            if(this.state.lightsOff.indexOf(id) == -1){
                                lightsOff.push(id); 
                            }
                            if(this.state.lightsOn.indexOf(id) > -1){
                                lightsOn = lightsOn.filter(light=>{
                                    return light != id
                                });
                            }
                            this.setState((prevState, props)=>({
                                lightsOn: lightsOn,
                                lightsOff: lightsOff
                            }))
                        }else{
                            if(this.state.lightsOn.indexOf(id) == -1){
                                lightsOn.push(id); 
                            }
                            if(this.state.lightsOff.indexOf(id) > -1){
                                lightsOff = lightsOff.filter(light=>{
                                    return light != id
                                });
                            }
                            this.setState((prevState, props)=>({
                                lightsOn: lightsOn,
                                lightsOff: lightsOff
                            }));
                        }
                    }
                }
            }
        })
        // this.state.lights.forEach((light)=>{
        //     let lightEvent = `${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_res`
        //     let lightColorEvent = `${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_color`;
        //     this.props.socket.on(lightColorEvent, (color)=>{
        //         this.setState({
        //             color: color
        //         })
        //     })
        //     this.props.socket.on(lightEvent, (lightLevel)=>{
                
                
                   
        //     })
        //     listeners.push(lightEvent);
        // });

        if(this.props.permissions === "analytics"){

        }
        this.setState({
            listeners: listeners
        });
    }

    // componentDidUpdate(){
    //     // let lightEvents = []
        
    //     // let listeners = [];
    //     this.state.lights.forEach((light)=>{
    //         let lightEvent = `${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_res`
    //         let lightColorEvent = `${light.props.instanceId.id}_${light.props.type.toLowerCase()}_${light.props.id}_color`;
    //         this.props.socket.on(lightColorEvent, (color)=>{
    //             this.setState({
    //                 color: color
    //             })
    //         })
    //         this.props.socket.on(lightEvent, (lightLevel)=>{
    //             let id = light.props.id;
    //             let type = light.props.type;
    //             let level = parseInt(lightLevel).toFixed(0);
    //             let lightsOff = this.state.lightsOff;
    //             let lightsOn = this.state.lightsOn;
    //             let lightInArea = true;
    //             if(lightLevel !== null){
    //                 if(lightInArea === true){
    //                     if(level == 0){    
    //                         if(this.state.lightsOff.indexOf(id) == -1){
    //                             lightsOff.push(id); 
    //                         }
    //                         if(this.state.lightsOn.indexOf(id) > -1){
    //                             lightsOn = lightsOn.filter(light=>{
    //                                 return light != id
    //                             });
    //                         }
    //                         this.setState((prevState, props)=>({
    //                             lightsOn: lightsOn,
    //                             lightsOff: lightsOff
    //                         }))
    //                     }else{
    //                         if(this.state.lightsOn.indexOf(id) == -1){
    //                             lightsOn.push(id); 
    //                         }
    //                         if(this.state.lightsOff.indexOf(id) > -1){
    //                             lightsOff = lightsOff.filter(light=>{
    //                                 return light != id
    //                             });
    //                         }
    //                         this.setState((prevState, props)=>({
    //                             lightsOn: lightsOn,
    //                             lightsOff: lightsOff
    //                         }));
    //                     }
    //                 }
    //             }
                
                   
    //         })
    //     });

        
    // }
    toLights(){
        let filter = {
            area: this.props.areaName,
            deviceType: "Light"
        }
        this.props.to(this.props.instance, filter);
    }
    render(){
        let lightsOnOutOfAHundred = (this.state.lightsOn.length/this.state.lights.length) * 100;
        
        let donutLevel = `${lightsOnOutOfAHundred} ${100-lightsOnOutOfAHundred}`;
        let color = this.state.color === null ? "#5EB158" : this.state.color
        return(
            <div style={{display: "flex", flexFlow: "column", alignItems: "center"}}>
            <svg width="100" height="100" viewBox="0 0 42 42">
                <g>
                <circle className="donut-ring" cx="21" cy="21" r="15.915494" fill="transparent" stroke="#5a5a5a" strokeWidth="4"></circle>
                <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={donutLevel} strokeDashoffset="0" ></circle>
                <circle cx="21" cy="21" r="13" fill="transparent" strokeWidth="3"></circle>
                <circle cx="21" cy="21" r="11" fill="transparent" stroke="#fff" strokeWidth="1"></circle>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em"fontSize="10px" fill={color}>{this.state.lightsOn.length}</text>
                </g>
            </svg>
                <div style={{color: color, fontSize: "20px", fontWeight:"500", cursor: "pointer", textTransform: "capitalize"}} onClick={this.toLights.bind(this)}>{((lights, permissions)=>{
                    if(lights.length === 1 && permissions === "analytics"){
                        return lights[0].props.name
                    }else{
                        return "Lights"
                    }
                })(this.state.lights, this.props.permissions)}</div>
            </div>
        )
    }
}

LightDonut.defaultProps = {
    lights: [1, 2]
}