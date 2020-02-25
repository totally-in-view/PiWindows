import React from "react";
import {genAPICall} from "./API"
import {ctof, ftoc} from "./Conversion"
export default class TempDonut extends React.Component {
    constructor(props){
        super(props)
        this.props.thermostats.forEach((thermostat)=>{
            thermostat.functions.forEach((funct)=>{
                if(funct.name === "status"){
                    let apiCall = genAPICall(thermostat.props.type, thermostat.props.id, funct.name, ["INDOOR"]);
                    this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: thermostat.props.instanceId});
                }
            });
        });
        this.state = {
            thermostats: this.props.thermostats,
            level: 0,
            listeners: []
        }
    }

    componentWillReceiveProps(nextProps){
        let level = this.state.level;
        let averageTracker = this.state.averageTracker;
        if(nextProps.alias !== this.props.alias || this.props.instance !== nextProps.instance){
            this.props.thermostats.forEach((thermostat)=>{
                thermostat.functions.forEach((funct)=>{
                    if(funct.name === "status"){
                        let apiCall = genAPICall(thermostat.props.type, thermostat.props.id, funct.name, ["INDOOR"]);
                        this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: thermostat.props.instanceId});
                    }
                });
            });

            level = 0;
            averageTracker = 1;
        }

        this.setState({
            thermostats: nextProps.thermostats,
            level: level,
            averageTracker: averageTracker
        })
        
    }
    componentDidMount(){
        let listeners = []
        let instanceId = this.state.thermostats[0].props.instanceId.id;
        this.props.socket.on(`${instanceId}_temp_donut_event`, (device, data)=>{
            let thermostat = this.state.thermostats.find(stateThermostat=>{
                return `${stateThermostat.props.instanceId.id}_${stateThermostat.props.type.toLowerCase()}_${stateThermostat.props.id}_res` == device
            });

            if(thermostat != null){
                if(data.includes("room")){
                    let temp = data[1];
                    let averageLevel = this.state.level;
                    averageLevel = ctof(parseInt(temp));
                    this.setState((prevState, props)=>({
                        level: averageLevel,
                    }))
                }
            }
        })
        this.state.thermostats.forEach((thermostat)=>{
            thermostat.functions.forEach((funct)=>{
                if(funct.name === "status"){
                    let apiCall = genAPICall(thermostat.props.type, thermostat.props.id, funct.name, ["INDOOR"]);
                    this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: thermostat.props.instanceId});
                }
            });

            let thermostatEvent = `${thermostat.props.instanceId.id}_${thermostat.props.type.toLowerCase()}_${thermostat.props.id}_res`;

            this.props.socket.on(thermostatEvent, (type, temp)=>{
                if(type === "room"){
                    
                }
            })

            listeners.push(thermostatEvent);
        });
        this.setState({
            listeners: listeners
        })
    }
    toTemperature(){
        let filter = {
            area: this.props.areaName,
            deviceType: "Thermostat"
        }
        this.props.to(this.props.instance, filter);
    }

    render(){
        let color = "";
        let level = this.state.level.toFixed(0);
        if(this.state.level >= 72){
            color = this.props.hotTempColor
        }else if (this.state.level <= 66){
            color = this.props.coolTempColor;
        }else{
            color = this.props.standardTempColor
        }
        let donutLevel = `${this.state.level} ${100-this.state.level}`
        if(this.state.level > 100 || this.state.level < 32){
            level = "- -";            
        }
        return(
            <div style={{display: "flex", flexFlow: "column", alignItems: "center"}}>
                <svg width="100" height="100" viewBox="0 0 42 42">
                    <g>
                        <circle className="donut-ring" cx="21" cy="21" r="15.915494" fill="transparent" stroke="#5a5a5a" strokeWidth="5"></circle>
                        <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={color} strokeWidth="5" strokeDasharray={donutLevel} strokeDashoffset="0" ></circle>
                        <circle cx="21" cy="21" r="13" fill="transparent" strokeWidth="3"></circle>
                        <circle cx="21" cy="21" r="11" fill="transparent" stroke="#fff" strokeWidth="1"></circle>
                        <text x="50%" y="50%" textAnchor="middle" fontSize="10px" dy=".3em" fill={color}>{level}</text>
                    </g>
                </svg>
                <div style={{color:color, fontSize: "20px", fontWeight:"500", cursor: "pointer"}} onClick={this.toTemperature.bind(this)}>Temperature</div>
            </div>
        )
    }
}

TempDonut.defaultProps = {
    standardTempColor: "#58AEB1",
    hotTempColor: "#FFA428",
    coolTempColor: "#3BBBFF"
}