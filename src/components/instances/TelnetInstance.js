import React from "react";

export default class TelnetInstance extends React.Component{
    constructor(props){
        super(props)
    }


    render(){
        return (
            <div>
                <div className="form-group">
                <label className="control-label mb-10 text-left">Instance ID</label>
                    <input type="text" name="Instance ID" className="form-control" defaultValue="" required/>
                </div>
                <div className="form-group">
                <label className="control-label mb-10 text-left">Address</label>
                    <input type="text" name="Address" className="form-control" defaultValue="" required/>
                </div>
                <div className="form-group">
                <label className="control-label mb-10 text-left">Port</label>
                    <input type="text" name="Port" className="form-control" defaultValue="" required/>
                </div>
            </div>
        )
    }
}