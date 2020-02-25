import React from "react";
import Panel from "./Panel";
import DriverSelection from "./driverdesigner/DriverSelection";
export default class Designer extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <Panel header={"Driver Designer"} body={
                <div>
                    <DriverSelection drivers={this.props.drivers}/>
                </div>
            }/>
        )
    }
}