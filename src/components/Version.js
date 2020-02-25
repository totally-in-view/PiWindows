import React from "react";

export default class Version extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            version: null
        }
    }

    componentDidMount(){
        this.props.socket.emit("get-version-number")
        this.props.socket.on("version-number", (version)=>{
            this.setState({
                version: version
            })
        })
    }

    render(){
        return (
            <div className="version-number">You are on version {this.state.version}</div>
        )
    }
}