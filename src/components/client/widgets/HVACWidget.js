import React from "react";
import {ftoc, ctof} from "./Conversion";
import {genAPICall} from "./API";

export default class HVACWidget extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            cool: this.props.properties.coolSet,
            heat: this.props.properties.heatSet,
            room: this.props.properties.roomTemp,
            mode: "stationary",
            heating: "",
            cooling: "",
            listeners: []
        }
    }
    static getDerivedStateFromProps(props, state){
        if(props.permissions === "analytics"){
            this.setState({
                cool: props.properties.coolSet,
                heat: props.properties.heatSet,
                room: props.properties.roomTemp
            })
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        return this.state.cool !== nextState.cool || this.state.heat !== nextState.heat || this.state.room !== nextState.room
    }
    componentDidMount(){
        const STATUSES = ["COOL", "HEAT", "INDOOR"]
        let thermostatEvent = `${this.props.properties.instanceId.id}_${this.props.properties.type.toLowerCase()}_${this.props.properties.id}_res`;
        this.props.functions.forEach((funct)=>{
            if(funct.name === "status"){
                for(const status of STATUSES){
                    let apiCall = genAPICall(this.props.properties.type, this.props.properties.id, funct.name, [status]);
                    this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
                }
            }
        })
        
        this.props.socket.on(thermostatEvent, (type, temp)=>{
            if(type === "room"){
                if(parseInt(temp) > 40 || parseInt(temp) < 90){
                    this.props.socket.emit("device-offline", {type: this.props.properties.diagnosticType, id: this.props.properties.id, instanceId: this.props.properties.instanceId});
                }
                this.setState({
                    room: parseInt(temp)
                })
            }else if(type === "cool"){
                this.setState({
                    cool: parseInt(temp)
                })
            }else if(type === "heat"){
                this.setState({
                    heat: parseInt(temp)
                })
            }
        })

        let listeners = [thermostatEvent];

        this.setState({
            listeners: listeners
        });
    }

    componentWillUnmount(){
    }
    adjustCooling(func, event){
        if(event.key === "Enter"){
            event.preventDefault();
            var temp = Number(event.target.textContent);
            if(temp < this.props.absoluteMax){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
                this.setState({
                    cool: ftoc(temp)
                })
            }
            else{
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(this.props.absoluteMax)])
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
                this.setState({
                    cool: ftoc(this.props.absoluteMax)
                });
            }    
        }

    }

    adjustHeating(func, event){
        if(event.key === "Enter"){
            event.preventDefault();
            var temp =  Number(event.target.textContent);
            if(temp > this.props.absoluteMin){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
                this.setState({
                    heat: ftoc(temp)
                })
            }
            else{
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(this.props.absoluteMin)])
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
                this.setState({
                    heat: ftoc(this.props.absoluteMin)
                });
            }    
        }
    }

    adjustRoomTemp(func, event){
        var temp = Number(event.target.value);
        if(temp < ctof(this.state.cool) && temp > ctof(this.state.heat)){
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
            this.props.socket.emit("phoenix-api-call",{cmd: apiCall, instanceId: this.props.properties.instanceId})
            this.setState({
                room: ftoc(temp)
            });
        }
    }
    toggleCooling(){
        if(this.state.cooling === ""){
            this.setState({
                cooling: "cooling",
                heating: ""
            })
        }
        else{
            this.setState({
                cooling: ""
            })
        }
    }

    toggleHeating(){
        if(this.state.heating === ""){
            this.setState({
                heating: "heating",
                cooling: ""
            })
        }
        else{
            this.setState({
                heating: ""
            })
        }
    }

    toggleFanMode(event){
        if(this.state.mode === "stationary"){
            this.setState({
                mode: "on"
            })
        }
        else{
            this.setState({
                mode: "stationary"
            })
        }
    }

    toCertainRoomTemp(func, event){
        if(event.key === "Enter"){
            event.preventDefault();

            // console.log(event.target.textContent);
            var temp = Number(event.target.textContent);

            if(temp > this.state.cool){
                temp = this.state.cool
            }
            else if(temp < this.state.heat){
                temp = this.state.heat
            }
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
            this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
            this.setState({
                room: ftoc(temp)
            })
        }
    }
    render(){
        // console.log(this.props)
        var coolFunc;
        var heatFunc;
        var roomFunc;


        this.props.functions.forEach((funct)=>{
            if(funct.widget === "Slider"){
                roomFunc = funct;
            }else if(funct.widget === "CoolSetText"){
                coolFunc = funct
            }else if(funct.widget === "HeatSetText"){
                heatFunc = funct;
            }
        })
        if(this.props.terminalMode === false){
            return(
                <div className="hvac-container">
                    <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center"}}>
                        
                        <div className = "temp" style={{display:"flex", flexFlow:"row"}}>
                            <div onKeyPress={this.adjustCooling.bind(this, coolFunc)} contentEditable>{ctof(this.state.cool).toFixed(2)}</div>&#176;<div>/</div><div onKeyPress={this.adjustHeating.bind(this, heatFunc)} contentEditable>{ctof(this.state.heat).toFixed(2)}</div>&#176;
                        </div>
                        <div className="temp-name">{this.props.properties.name}</div>
                        <div className = "temp-level"><div onKeyPress={this.toCertainRoomTemp.bind(this, roomFunc)}>{ctof(this.state.room).toFixed(2)}</div>&#176;</div>
                    </div>
                    
                     <input type="range" step={.1} min={this.props.absoluteMin} max={this.props.absoluteMax} onChange={this.adjustRoomTemp.bind(this, roomFunc)} className="slider hvacslider" value={ctof(this.state.room).toFixed(2)} list="ranges"/>
                </div>
            )
        }
        else{
            return(
                <div className="terminal-hvac-container">
                   <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center"}}>
                        
                        <div className = "temp" style={{display:"flex", flexFlow:"row"}}>
                            <div onKeyPress={this.adjustCooling.bind(this, coolFunc)} contentEditable>{ctof(this.state.cool).toFixed(2)}</div>&#176;<div>/</div><div onKeyPress={this.adjustHeating.bind(this, heatFunc)} contentEditable>{ctof(this.state.heat).toFixed(2)}</div>&#176;
                        </div>
                        <div className="temp-name">{this.props.properties.name}</div>
                        <div className = "temp-level"><div onKeyPress={this.toCertainRoomTemp.bind(this, roomFunc)}>{ctof(this.state.room).toFixed(2)}</div>&#176;</div>
                    </div>
                    <input type="range" step={.1} min={this.props.absoluteMin} max={this.props.absoluteMax} onChange={this.adjustRoomTemp.bind(this, roomFunc)} className="slider hvacslider" value={ctof(this.state.room).toFixed(2)} list="ranges"/>
                </div>
            )
        }
    }
}

HVACWidget.defaultProps =  {
    properties: {
        name: ""
    },
    functions: [],
    absoluteMin: 50,
    absoluteMax: 90,
    terminalMode: false
}