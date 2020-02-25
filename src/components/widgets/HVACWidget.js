import React from "react";
import Button from "./Button";
import Fan from "./Fan";
import Cool from "./Cool";
import Heat from "./Heat";
import {ftoc, ctof} from "./Conversion";
import {genAPICall} from "./API";

export default class HVACWidget extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            cool: 24,
            heat: 21,
            room: 23,
            mode: "stationary",
            heating: "",
            cooling: ""
        }

    }

    adjustCooling(func, event){
        if(event.key == "Enter"){
            event.preventDefault();
            var temp = Number(event.target.textContent);
            if(temp < this.props.absoluteMax){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
                this.props.socket.emit("phoenix-api-call", apiCall)
                this.setState({
                    cool: temp
                })
            }
            else{
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(this.props.absoluteMax)])
                this.props.socket.emit("phoenix-api-call", apiCall)
                this.setState({
                    cool: this.props.absoluteMax
                });
            }    
        }

    }

    adjustHeating(func, event){
        if(event.key == "Enter"){
            event.preventDefault();
            var temp =  Number(event.target.textContent);
            if(temp > this.props.absoluteMin){
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
                this.props.socket.emit("phoenix-api-call", apiCall)
                this.setState({
                    heat:temp
                })
            }
            else{
                var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(this.props.absoluteMin)])
                this.props.socket.emit("phoenix-api-call", apiCall)
                this.setState({
                    heat: this.props.absoluteMin
                });
            }    
        }
    }

    adjustRoomTemp(func, event){
        var temp = Number(event.target.value);
        
        if(temp < this.state.cool && temp > this.state.heat){
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                room: temp
            });
        }
    }
    toggleCooling(){
        if(this.state.cooling == ""){
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
        if(this.state.heating == ""){
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
        if(this.state.mode == "stationary"){
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
        if(event.key == "Enter"){
            event.preventDefault();

            console.log(event.target.textContent);
            var temp = Number(event.target.textContent);

            if(temp > this.state.cool){
                temp = this.state.cool
            }
            else if(temp < this.state.heat){
                temp = this.state.heat
            }
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, func.name, [ftoc(temp)])
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                room: temp
            })
        }
    }
    render(){
        var coolFunc;
        var heatFunc;
        var roomFunc;


        this.props.functions.forEach((funct)=>{
            if(funct.widget == "Slider"){
                roomFunc = funct;
            }else if(funct.widget == "CoolSetText"){
                coolFunc = funct
            }else if(funct.widget == "HeatSetText"){
                heatFunc = funct;
            }
        })
        return(
            <div className="widgetcontainer">
                <div className="widgetheader">
                    <div className="left">
                        <div className="button"><Button /></div>
                        <div className="light-name">{this.props.properties.name}</div>
                    </div>
                    <div className = "light-level"><div onKeyPress={this.toCertainRoomTemp.bind(this, roomFunc)} contentEditable>{this.state.room}</div>&#176;</div>
                </div>
                <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between"}}>
                    <div>
                        <div className="temp">
                            <div onKeyPress={this.adjustCooling.bind(this, coolFunc)} contentEditable>{ctof(this.state.cool)}</div>&#176;<Cool className={this.state.cooling} onClick={this.toggleCooling.bind(this)} style={{width: "15%"}} />
                        </div>
                        <div className="temp">
                            <div onKeyPress={this.adjustHeating.bind(this, heatFunc)} contentEditable>{ctof(this.state.heat)}</div>&#176;<Heat className={this.state.heating} onClick={this.toggleHeating.bind(this)} style={{width: "15%"}} />
                        </div>
                    </div>
                    <Fan onClick={this.toggleFanMode.bind(this)} style={{width: "10%"}} className={this.state.mode}/>
                </div>
                 <input type="range" step={.1} min={this.props.absoluteMin} max={this.props.absoluteMax} onChange={this.adjustRoomTemp.bind(this, roomFunc)} className="slider hvacslider" value={this.state.room} list="ranges"/>
            </div>
        )
    }
}

HVACWidget.defaultProps =  {
    properties: {
        name: ""
    },
    functions: [],
    absoluteMin: 50,
    absoluteMax: 90
}