import React from "react";

export default class RESTInstance extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            auth: null
        }
    }
    changeAuth(event){
        if(event.target.value == "Token"){
            this.setState({auth: "token"});
        }
        else if(event.target.value == "Username/Password"){
            this.setState({auth: "user"});
        }
    }
    render(){
        var authInfo;
        if(this.state.auth != null){
            if(this.state.auth == "token"){
                authInfo =  <div className="form-group">
                                <label className="control-label mb-10 text-left">Token</label>
                                <input type="text" name="Token" className="form-control" defaultValue="" required/>
                            </div>
            }
        }
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
                <label className="control-label mb-10 text-left">Path</label>
                    <input type="text" name="Path" className="form-control" defaultValue="" required/>
                </div>
                <div className="form-group">
                    <label className="control-label mb-10 text-left">API Token</label>
                    <input type="text" name="Token" className="form-control" defaultValue="" required/>
                </div>
            </div>

        )
    }
} 