import React from "react";

export default class DriverSelection extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            driver: {
                type: "",
                description: ""
            },
            parentDriver: "",
            step: 1
        }
    }
    render(){
        let selectionText = []
        if(this.state.step == 1){
            selectionText = <div style={{display: "flex", flexFlow: "row", justifyContent: "center", alignItems: "center"}}><div contentEditable></div></div>
        }
        return(
            <div>{selectionText}</div>
        )
    }
}