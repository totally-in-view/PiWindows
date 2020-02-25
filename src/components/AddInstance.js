import React from "react";
import Panel from "./Panel";
import Form from "./Form";
import TelnetInstance from "./instances/TelnetInstance";
import RESTInstance from "./instances/RESTInstance";

//REDUX
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {changeAuth, changeHeader, changeHost, changeName, changePath, changeService, redirect} from "../store/actions/index";
import store from "../store/store";

//React-Router
import {Route, Redirect, withRouter } from "react-router-dom";
class AddInstance extends React.Component {
    constructor(props){
        super(props);
    }

    handleSubmit(event){
        event.preventDefault();
        var path;
        var instance = {
            service: "",
            name: "",
            address: "",
            id: Math.floor(Math.random()*2000),
            aliases: []
        }
        for(var i = 0; i < event.target.length; i++){
            var input = event.target[i];

            if(input.name == "Web Service"){
                instance.service = input.value
            }
            if(input.name == "Instance ID"){
                instance.name = input.value
            }
            if(input.name == "Address"){
                instance.address = input.value
            }
            if(input.name == "Port"){
                instance["port"] = input.value
            }
            if(input.name == "Path"){
                console.log(input.value);
                instance["path"] = input.value
            }
            if(input.name == "Token"){
                instance["token"] = input.value
            }

       }
       console.log(instance);

       this.props.socket.emit("add-instance-to-db", instance);
       this.props.add(instance);
       this.props.redirect({redirect: true, view: <Redirect to="/add-device/instance" />});
    }
    
    handleSelectChange(key, event){
       if(event.target.name == "Web Service"){
        var service = event.target.value,
            view = "";

        if(service == "Telnet"){
            view = <Redirect to="/add-instance/telnet"/> 
        }

        if(service == "REST"){
            view = <Redirect to ="/add-instance/rest"/>
        }

        this.props.changeService(service, view);
       }
        
    }



    render(){
        var forminputs = [];
        var state = this.props.instance
        
        return(
            <div>
            {state.view}
            <Panel header={"New Instance"} body={
                <div className="form-wrap">
                    <form onSubmit={this.handleSubmit.bind(this)}>
                    <div className="form-group">
                     <label className="control-label mb-10 text-left">Web Service</label>
                       <select className="form-control" name="Web Service" onChange={this.handleSelectChange.bind(this, "Web Service")} required>
                           <option></option>
                           <option>Telnet</option>
                           <option>REST</option>
                           <option>SOAP</option>
                       </select>
                    </div>
                    
                    <Route path="/add-instance/telnet" render={(props)=>{return (<TelnetInstance />)}} />
                    <Route path="/add-instance/rest" render={(props)=>{return(<RESTInstance />)}} />
                        <button type="submit" className="btn btn-success btn-block">Add Instance</button>

                        <div className="actions clearfix">
            {/* <ul role="menu" aria-label="Pagination">
                <li className="disabled" aria-disabled="true">
                <input type="submit" role="menuitem" value=" Previous"/>
                </li>
                <li
                aria-hidden="false"
                aria-disabled="false"
                className
                style={{ display: "inline-block" }}     
                >
                    <input type="submit" role="menuitem" value="Next"/>
                       
                    
                </li>
            </ul> */}
        </div>
                    </form>
                </div>
            }/> 
            </div>
        );
    }

}


AddInstance.defaultProps = {
    service: "",
    fields: [
        {
            label: "Web Service",
            type: "select",
            options: [
                "Telnet", 
                "REST",
                "SOAP",
            ]
        },
        {
            label: "Name",
            type: "text"
        },
        {
            label: "Address",
            type: "text"
        }
    ]
        
}

const mapDispatchToProps = dispatch=>{
    return bindActionCreators({
        changeAuth: changeAuth,
        changeHeader: changeHeader,
        changeHost: changeHost,
        changeName: changeName,
        changePath: changePath,
        changeService: changeService,
    }, dispatch);
}

const mapStateToProps = state=>{
    return {
        instance: state.instance
    }
}

export default withRouter(connect(mapStateToProps,mapDispatchToProps)(AddInstance));