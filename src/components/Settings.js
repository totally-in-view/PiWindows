import React from "react";
import InstanceSettings from "./settings/InstanceSettings";
import DeviceSettings from "./settings/DeviceSettings";
export default class Settings extends React.Component{
    constructor(props){
        super(props);
        this.adminPassword = "T1V_2019"
        this.analyticsPassword = "T1V_Analytics";
        this.diagnosticTimeRefs = [];
        this.newDiagnosticTime = React.createRef();
        this.state = {
            views: {
                general: "active",
                devices: "inactive",
                instances: "inactive",
                advanced: "inactive"
            },
            password: "",
            diagnosticTimes: [],
            adminSettings: {
                analytics: null, 
                diagnostics: null
            }
        }
    }

    componentDidMount(){
        this.props.socket.emit("get-user-settings", this.props.socket.nickname)
        this.props.socket.emit("get-admin-settings");
        this.props.socket.on("admin-settings", (settings)=>{
            this.setState({
                adminSettings: settings
            })
        })
        this.props.socket.on("user-settings", times=>{
            for(var i = 0; i < times.length; i++){
                this.diagnosticTimeRefs[i] = React.createRef();
            }
            this.setState({
                diagnosticTimes: times
            })
        })
    }

    to(view, event){
        event.preventDefault();
        var views = this.state.views;

        for(var prop in views){
            if(prop === view){
                views[prop] = "active"
                switch(prop){
                    case "devices":
                        this.props.socket.emit("get-devices")
                }
            }else{
                views[prop] = "inactive"
            }
        }


        this.setState({
            views: views
        })
    }

    uploadFile(event){
        let files = [];
        if (event.dataTransfer) {
          let data = event.dataTransfer
      
          if (data.files && data.files.length) {
            files = data.files
          } else if (data.items && data.items.length) {
            files = data.items
          }
        } else if (event.target && event.target.files) {
          files = event.target.files
        }

        var reader = new FileReader();
        reader.onload = (event)=>{
            this.props.socket.emit("save-logo", (event.target.result));
        }

        reader.readAsArrayBuffer(files[0])

        
    }

    updatePassword(event){
        this.setState({
            password: event.target.value
        })
    }

    login(){
        if(this.state.password === this.adminPassword){
            this.props.validatePrivileges("admin");
            this.props.socket.emit("admin-mode");
        }else if(this.state.password === this.analyticsPassword){
            this.props.validatePrivileges("analytics")
        }else{
            this.props.validatePrivileges("client")
        }
        this.setState({
            password: ""
        })
    }
    
    logout(){
        this.props.validatePrivileges(false);
    }
    addDiagnosticTime(time){
        let diagnosticTime = time.current.value;
        let times = this.state.diagnosticTimes;
        times.push(diagnosticTime)
        this.diagnosticTimeRefs.push(React.createRef());
        this.setState({
            diagnosticTimes: times
        })
    }

    updateDiagnosticTime(time, index){
        let diagnosticTime = time.current.value;
        let times = this.state.diagnosticTimes;
        times = times.filter(timeValue=>{
            return timeValue !== diagnosticTime
        });
        this.diagnosticTimeRefs = this.diagnosticTimeRefs.filter(ref=>{
            return ref.current !== time.current
        })

        this.setState({
            diagnosticTimes: times
        })
    }

    deleteDiagnosticTime(index){
        let times = this.state.diagnosticTimes;
        let newTimes = []
        let newRefs = []
        for(let i = 0; i < times.length; i++){
            if(i !== index){
                newTimes.push(times[i])
                newRefs.push(this.diagnosticTimeRefs[i]);
            }
            
        }
        this.diagnosticTimeRefs = newRefs;
        this.setState({
            diagnosticTimes: newTimes
        })
    }
    changeUserSettings(event){
        let times = [];
        event.preventDefault();
        let elements = event.target.elements;
        for(let i = 0; i< elements.length; i++){
            let el = elements[i];
            let id = el.id;

            if(id !== null){
                if(times.indexOf(el.value) === -1 && el.value !== ""){
                    times.push(el.value);
                }
            }
        }
        this.props.socket.emit("change-user-settings", this.props.socket.nickname,times);

    }

    changeAdminSettings(event){
        let diagnosticAddress, analyticsAddress;
        event.preventDefault();
        let elements = event.target.elements;
        for(let i = 0; i < elements.length; i++){
            let el = elements[i];
            let id = el.id;
            if(id === "analytics-address"){
                analyticsAddress = el.value;
            }else if(id === "diagnostics-address"){
                diagnosticAddress = el.value;
            }
        }
        this.props.socket.emit("change-admin-settings", diagnosticAddress, analyticsAddress)
    }
    render(){
        let settingsUI;
        if(this.state.views.general === "active" && (this.props.permissions === "client" || this.props.permissions === "analytics")){


        settingsUI = <form onSubmit={this.changeUserSettings.bind(this)}> 
                     <div className="col-sm-12">
                        <label className="control-label mb-10 text-label">Diagnostic Times</label>
                        {
                            this.state.diagnosticTimes.map( (time, index)=>{
                                return  <div className="form-group">
                                                <div style={{display:"flex", flexFlow: "row", alignItems:"center" }}>
                                                    <input id={`diagnostic-time-${index}`}ref={this.diagnosticTimeRefs[index]}className="form-control" type="time" value={time}/>
                                                    <div style={{display: "flex", flexFlow: "column"}}>
                                                        <span onClick={this.updateDiagnosticTime.bind(this, this.diagnosticTimeRefs[index], index)} title="Update Time" className="fa fa-pencil-square font-button"></span>
                                                        <span onClick={this.deleteDiagnosticTime.bind(this, index)}title="Delete Time" className="fa fa-minus-square font-button"></span>
                                                    </div>
                                                </div>
                                            </div>
                            })
                        }
                            <div className="form-group">
                                <label className="control-label mb-10 text-label">Add Diagnostic Time</label>
                                <div style={{display: "flex", flexFlow: "row"}}>
                                    <input className="form-control" type="time" ref={this.newDiagnosticTime}/>
                                    <span onClick={this.addDiagnosticTime.bind(this, this.newDiagnosticTime)} title="Add Diagnostics Time" className="fa fa-plus-square font-button"></span>
                                </div>
                            </div>
                     </div>

                     <button className="btn btn-primary" type="submit">Change Settings</button>
                     </form>
        }else if (this.state.views.general === "active" && (this.props.permissions === "admin")){
            settingsUI =<form onSubmit={this.changeAdminSettings.bind(this)}> 
                            <div className="col-sm-12">
                                <div className="form-group" style={{display: "flex", flexFlow: "column"}}>
                                    <label className="control-label mb-10 text-label">Analytics Address</label>
                                    <input type="text" className="form-group" id="analytics-address" placeholder={this.state.adminSettings.analytics}/>
                                </div>
                                <div className="form-group" style={{display: "flex", flexFlow: "column"}}>
                                    <label className="control-label mb-10 text-label">Diagnostic Address</label>
                                    <input type="text" className="form-group" id="diagnostics-address" placeholder={this.state.adminSettings.diagnostics}/>
                                </div>
                            </div>
                            <button className="btn btn-primary" type="submit">Change Settings</button>
                        </form>
        }else if(this.state.views.advanced === "active"){
            settingsUI = <div className="col-sm-6">
                            <div className = 'form-group'>
                                <label className="control-label mb-10-text-label">Password</label>
                                <input type="password" className="form-control" onChange={this.updatePassword.bind(this)} value={this.state.password}/>
                            </div>
                            <button className="btn btn-primary" onClick={this.login.bind(this)} style={{marginRight: '10px'}}>Login</button>
                            <button className="btn btn-danger" onClick={this.logout.bind(this)}>Logout</button>
                        </div>
        }else if(this.state.views.instances === "active"){
            settingsUI = <InstanceSettings socket={this.props.socket} instances={this.props.file.instances} updateFile={this.props.update.bind(this)} map={this.props.map}/>
        }else if(this.state.views.devices === "active"){
            settingsUI = <DeviceSettings socket={this.props.socket} instances={this.props.file.instances} devices={this.props.file.devices} drivers={this.props.drivers} updateFile={this.props.update.bind(this)} />
        }
        
        return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="card-view panel panel-default">
                        <div className="panel-heading">
                            <div className="pull-left">
                                <h6 className="panel-title txt-dark">Settings</h6>
                            </div>
                            <div className="pull-right">
                                <div className="tab-struct custom-tab-1">
                                    <ul className="nav-tabs">
                                        <li className={this.state.views.general} onClick={this.to.bind(this, "general")}><a href="#">General</a></li>
                                        <li className={this.state.views.devices} onClick={this.to.bind(this, "devices")}><a href="#">Devices</a></li>
                                        <li className={this.state.views.instances} onClick={this.to.bind(this, "instances")}><a href="#">Instances</a></li>
                                        <li className={this.state.views.advanced} onClick={this.to.bind(this, "advanced")}><a href="#">Advanced</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    
                        <div className="clearfix"></div>
                    
                        <div className="panel-wrapper collapse in">
                            <div className="panel-body">
                                <div className="row" style={{width: "100%"}}>
                                    {settingsUI}
                                </div>                         
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}