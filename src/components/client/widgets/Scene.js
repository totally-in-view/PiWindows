import React from "react"
import {genAPICall} from "./API";

export default class Scene extends React.Component {
    constructor(props){
        super(props);
        let active = "";

        if(this.props.properties.active === true){
            active = "active-scene";
        }else{
            active = "inactive-scene";
        }

        this.state = {
            active: "inactive-scene",
            event: null
        }
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.permissions === "analytics"){
            let active = "";
            if(nextProps.props.properties.active === true){
                active = "active-scene";
            }else{
                active = "inactive-scene";
            }

            this.setState = ({
                active: active,
            });
        }
    }
    
    shouldComponentUpdate(nextProps, nextState){
        return this.state.active !== nextState.active
    }
    componentDidMount(){
        this.props.functions.forEach((funct)=>{
            if(funct.name === "status"){
                let apiCall = genAPICall(this.props.properties.type, this.props.properties.id, funct.name);
                this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
            }
        }); 
        let event = `${this.props.properties.instanceId.id}_${this.props.properties.type.toLowerCase()}_${this.props.properties.id}_res`
        
        if(this.props.permissions === "client"){
            this.props.socket.on(event, (state)=>{
                console.log(this.props.properties.name, state)
                if(state != null){
                    if(state === "off" || state == "0"){
                        this.setState({
                            active: "inactive-scene"
                        })
                    }else{
                        this.setState({
                            active: "active-scene"
                        })
                    }
                }
                
            })
        }

        this.setState({
            event: event
        })
    }

    componentWillUnmount(){
    }
    activateScene(funct){
        let apiCall =  genAPICall(this.props.properties.type, this.props.properties.id, funct.name);
        // console.log(apiCall)
        // console.log(this.props.properties)

        this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
        this.setState({
            active: "active-scene"
        })
    }
    deactivateScene(funct){
        let apiCall =  genAPICall(this.props.properties.type, this.props.properties.id, funct.name);
        // console.log(apiCall)
        // console.log(this.props.properties)
        this.props.socket.emit("phoenix-api-call", {cmd: apiCall, instanceId: this.props.properties.instanceId});
        this.setState({
            active: "inactive-scene"
        })
    }

    toggleScene(apiCall){
        if(this.state.active === "inactive-scene"){
            this.activateScene(apiCall);
        }
        else{
            this.deactivateScene(apiCall)
        }
    }
    render(){
        if(this.props.terminalMode === false){
            return(
                <button className={`btn scene-btn ${this.state.active}`} onClick={this.toggleScene.bind(this, this.props.functions[0])}>{this.props.properties.name}</button>
            )
        }else{
            return(
                <button className={`btn terminal-scene-btn ${this.state.active}`} onClick={this.toggleScene.bind(this, this.props.functions[0])}>{this.props.properties.name}</button>
            )
        }
    }
    
}

Scene.defaultProps = {
    name: "Scene Button",
    apiCall: "api_call",
    terminalMode: false
}
