import React from "react";
import Button from "./Button";
import {genAPICall} from "./API";
export default class LightingWidget extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            level: props.properties.level,
            event: null
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.state.level !== nextState.level || this.props.properties.level != nextProps.properties.level
    }

    static getDerivedStateFromProps(props, state){
        if(props.permissions.toLowerCase() === "analytics"){
           
            return {
                level: props.properties.level
            }
        }
        return null;
    }
    
    componentDidMount(){
            let event = `${this.props.properties.instanceId.id}_${this.props.properties.type.toLowerCase()}_${this.props.properties.id}_res`
            this.props.socket.on(event, (level)=>{
                this.setState({
                    level: parseInt(level).toFixed(0)
                })
            })
    
            this.props.functions.forEach((funct)=>{
                if(funct.name === "status"){
                    let apiCall = genAPICall(this.props.properties.type, this.props.properties.id, funct.name);
    
                    this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId})
                }
            })
    
            this.setState({
                event: event
            })
        
    }

    componentWillUnmount(){
        let event = `${this.props.properties.instanceId.id}_${this.props.properties.type.toLowerCase()}_${this.props.properties.id}_res`
        this.props.socket.removeAllListeners(this.state.event)
    }

    changeLevel(dim, event){
        var value = event.target.value;
        var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, dim.name, [value]);
        this.props.socket.emit("phoenix-api-call",{cmd: apiCall, instanceId: this.props.properties.instanceId});
        this.setState({
            level: value
        })
    }

    toggleLoad(on, off, event){
        if(this.state.level > 0){
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, off.name, [0]);
            this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
            this.setState({
                level: 0
            })
        }
        else{
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, on.name, [100]);
            this.props.socket.emit("phoenix-api-call",  {cmd: apiCall, instanceId: this.props.properties.instanceId})
            this.setState({
                level: 100
            })
        }
    }

    toCertainLevel(event){
        if(event.key === "Enter"){
            event.preventDefault(); 
            this.setState({
                level: event.target.textContent.replace("%", "")
            })
        }
    }
    
    render(){
        var onOff = {
            on: "",
            off: ""
        };
        var dim;

        this.props.functions.forEach((funct)=>{
            if(funct.widget === "Button"){
                if(funct.name.includes("on")){
                    onOff.on = funct;
                }
                else{
                    onOff.off = funct
                }
            }
            else if(funct.widget === "Slider"){
                dim = funct
            }
        })
        if(this.props.terminalMode === false){
            return(
                <div className="widgetcontainer">
                    <div className="widgetheader">
                        <div className="left">
                            <div className="button"><Button onClick={this.toggleLoad.bind(this, onOff.on, onOff.off)} /></div>
                            <div className="light-name">{this.props.properties.name}</div>
                        </div>
                        <div className="light-level" onKeyPress={this.toCertainLevel.bind(this)} contentEditable>{`${this.state.level}%`}</div>
                    </div>
                    <input type="range" className="slider" list="ranges" onChange={this.changeLevel.bind(this, dim)} value={this.state.level}/>
                </div>
            )
        }
        return(
            <div className="terminal-widgetcontainer">
                <div className="widgetheader">
                    <div className="terminal-left">
                        <div className="terminal-button"><Button onClick={this.toggleLoad.bind(this, onOff.on, onOff.off)} /></div>
                        <div className="terminal-light-name">{this.props.properties.name}</div>
                    </div>
                    <div className="terminal-light-level" onKeyPress={this.toCertainLevel.bind(this)} contentEditable>{`${this.state.level}%`}</div>
                </div>
                <input type="range" className="slider" list="ranges" onChange={this.changeLevel.bind(this, dim)} value={this.state.level}/>
            </div>
        )
    }
}

LightingWidget.defaultProps = {
    properties: {
        type: "Load",
        id: 0,
        name: "Light Name",
    },
    functions: [],
    terminalMode: false
}

