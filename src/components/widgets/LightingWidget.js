import React from "react";
import Button from "./Button";
import {genAPICall} from "./API";
export default class LightingWidget extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            level: 0
        }
    }
    componentDidMount(){
        // this.props.socket.emit("create-new-device", {id: this.props.id, name: this.props.name, type: this.props.type});
    } 
    changeLevel(dim, event){
        var value = event.target.value;
        var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, dim.name, [value]);
        this.props.socket.emit("phoenix-api-call",apiCall);
        this.setState({
            level: value
        })
    }

    toggleLoad(on, off, event){
        if(this.state.level > 0){
            console.log(off);
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, off.name, [0]);
            console.log(apiCall);
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                level: 0
            })
        }
        else{
            console.log(on);
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, on.name, [100]);
            console.log(apiCall);
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                level: 100
            })
        }
    }

    toCertainLevel(event){
        if(event.key == "Enter"){
            event.preventDefault();
            console.log(event.target.textContent);
            
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
            if(funct.widget == "Button"){

                console.log(funct)
                if(funct.name.includes("on")){
                    onOff.on = funct;
                }
                else{
                    onOff.off = funct
                }
            }
            else if(funct.widget == "Slider"){
                dim = funct
            }
        })
        return(
            <div className="widgetcontainer">
                <div className="widgetheader">
                    <div className="left">
                        <div className="button" ><Button onClick={this.toggleLoad.bind(this, onOff.on, onOff.off)} /></div>
                        <div className="light-name">{this.props.properties.name}</div>
                    </div>
                    <div className="light-level" onKeyPress={this.toCertainLevel.bind(this)} contentEditable>{`${this.state.level}%`}</div>
                </div>
                <input type="range" class="slider" list="ranges" onChange={this.changeLevel.bind(this, dim)} value={this.state.level}/>
            </div>
        )
    }
}

LightingWidget.defaultProps = {
    properties: {
        name: "Light Name",
    },
    functions: []
}

