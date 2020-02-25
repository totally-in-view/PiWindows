import React from "react";
import Button from "./Button";
import {genAPICall} from "./API";

export default class ShadeWidget extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            level: this.props.properties.level
        }

    }
    
    toggleShade(openClose){
        if(this.state.level > 0){
            if(openClose.close !== null){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, openClose.close.name);
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
                this.setState({
                    level: 0
                })
            }
            
        }else{
            if(openClose.open !== null){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, openClose.open.name);
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
                this.setState({
                    level: 100
                })
            }
            
        }
    }

    pos(posFunc,level){
        if(posFunc !== null){
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, posFunc.name, [level]);
            this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
            this.setState({
                level: level
            })
        }
    }

    render(){
        var openClose = {
            open: null,
            close: null
        }
        var toPos;
        this.props.functions.forEach((funct)=>{
            if(funct.widget === "Button"){
                if(funct.name === "open"){
                    openClose.open = funct
                }else{
                    openClose.close = funct
                }
            }else if(funct.widget === "Shade"){
                toPos = funct
            }
        })
        if(this.props.terminalMode === false){
            return(
                <div className="widgetcontainer">
                    <div className="widgetheader">
                        <div className="left" style={{width: "300px"}}>
                            <div className="light-name">{this.props.properties.name}</div>
                        </div>
                    </div>
                    <div className="shade-options">
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.toggleShade.bind(this, openClose)}><Button /></div>
                            <div className="shade-button-tag"> Open/Close </div>
                        </div>
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 25)}><Button /></div>
                            <div className="shade-button-tag"> 25% </div>
                        </div>
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 50)}><Button /></div>
                            <div className="shade-button-tag"> 50% </div>
                        </div>
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 75)}><Button /></div>
                            <div className="shade-button-tag"> 75% </div>
                        </div>
                    </div>
                </div>
            )
        }else{
            return(
                <div className="terminal-widgetcontainer">
                    <div className="widgetheader">
                        <div className="left" style={{width: "300px"}}>
                            <div className="light-name">{this.props.properties.name}</div>
                        </div>
                    </div>
                    <div className="shade-options">
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.toggleShade.bind(this, openClose)}><Button /></div>
                            <div className="shade-button-tag"> Open/Close </div>
                        </div>
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 25)}><Button /></div>
                            <div className="shade-button-tag"> 25% </div>
                        </div>
                    </div>
                    <div className="shade-options">
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 50)}><Button /></div>
                            <div className="shade-button-tag"> 50% </div>
                        </div>
                        <div className="shade-option">
                            <div className="shade-button" onClick={this.pos.bind(this, toPos, 75)}><Button /></div>
                            <div className="shade-button-tag"> 75% </div>
                        </div>
                    </div>
                </div>
            )
        }
        
    }
}

ShadeWidget.defaultProps =  {
    properties: {
        name: "Default Shade"
    },
    functions: [],
    terminalMode: false
}