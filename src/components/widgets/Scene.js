import React from "react"
import {genAPICall} from "./API"
export default class Scene extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            active: "inactive-scene"
        }
    }

    activateScene(apiCall){

        this.setState({
            active: "active-scene"
        })
    }
    deactivateScene(apiCall){
        this.setState({
            active: "inactive-scene"
        })
    }

    toggleScene(apiCall){
        if(this.state.active == "inactive-scene"){
            this.activateScene(apiCall);
        }
        else{
            this.deactivateScene(apiCall)
        }
    }
    render(){
        return(
            <button className={`btn scene-btn ${this.state.active}`} onClick={this.toggleScene.bind(this, this.props.apiCall)}>{this.props.name}</button>
        )
    }
    
}

Scene.defaultProps = {
    name: "Scene Button",
    apiCall: "api_call"
}

//Test