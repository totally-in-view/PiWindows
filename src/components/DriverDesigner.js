import React from "react";
import Panel from "./Panel";
import RESTWindow from "./RESTWindow";
export default class DriverDesigner extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            driver: {
                mode: "REST",
                props: {

                },
                functions: []
            }
        }
    }
    render(){
        return (<Panel header={"Driver Designer"} body={
            <div>
                <RESTWindow />
            </div>
        }/>)
    }
}