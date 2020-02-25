import React from "react";
import {Index} from "./client/widgets/index";
import NetworkTable from "./NetworkTable";
import DiagnoseDevices from "./DiagnoseDevices";
import NetworkAnalytics from "./NetworkAnalytics";
import Report from "./Reports";
export default class Terminal extends React.Component {
    constructor(props){
        super(props); 
        this.state = {
            logs: new Map(),
            currentInstance: {id: 0},
            currentInstanceDevices: [],
            mainContentView: "logs",
            instances: [],
            sidebarHidden: false
        }
    }
    componentWillReceiveProps(nextProps){
        this.setState({
            instances: nextProps.instances
        })
    }
    componentDidMount(){
        this.props.socket.on("getting-devices", (devices)=>{
            this.setState({
                currentInstanceDevices: devices
            })
        });

        this.props.socket.on("logs-received", (logs, instance)=>{
            let terminalLogs = [];
            logs.forEach((log)=>{
                terminalLogs.push(log.log);
            });
            let logsState = this.state.logs;
            logsState.set(instance.id, terminalLogs)
            this.setState({
                logs: logsState
            })
        })
    }

    clearLog(){
        this.setState({
            logs: []
        });
    }

    sendMessage(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.props.socket.emit("terminal-command", {command: `${event.target.textContent}\r\n`, instance: this.state.currentInstance})
        }
    }

    fromJSONArrToHTML(jsonArr){
        var jsonHTML = [];
        var jsonObjs = []
        
        jsonArr.forEach((json)=>{
            var jsonProps = [];
            for(var prop in json ){
                jsonProps.push(<div className="property"><div className="prop-name">{prop}</div>:<div className={`value ${typeof json[prop]}`}>{json[prop]}</div></div>)
            }

            jsonObjs.push(<div className="json-object">{"{"}{jsonProps}{"}"}</div>)
        })
        var logs = this.state.logs;

        jsonHTML = <div className="json-array">
                        [{jsonObjs}]
                    </div>
        logs.push(jsonHTML);
        this.setState({
            logs: logs
        })
    }

    changeInstance(event){
        this.props.instances.forEach((instance)=>{
            if(instance.name === event.target.value){
                this.props.socket.emit("get-instance-devices-from-db", {id: instance.id})
                this.props.socket.emit("get-logs", {id: instance.id});
                this.setState({
                    currentInstance: instance
                })

            }
        })
    }

    openLogs(){
        this.setState({
            mainContentView: "logs"
        })
    }

    openNetwork(){
        this.setState({
            mainContentView: "network"
        })
    }

    reboot(){
        this.props.socket.emit("reboot", this.state.currentInstance)
    }

    diagnoseDevices(){
        this.setState({
            mainContentView: "diagnoseDevices"
        });
    }

    toggleSidebar(){
        this.setState((prevState, props)=>({
            sidebarHidden: !prevState.sidebarHidden
        }))
    }
    reports(){
        this.setState({
            mainContentView: "reports"
        })
    }
    analytics(){
        this.setState({
            mainContentView: "analytics",
            sidebarHidden: true
        })
    }
    render(){
        let mainView;
        let sideView;
        let analyticsAction = <span title="Network Analytics" onClick={this.analytics.bind(this)} style={{fontSize: "25px"}} className="fa fa-line-chart font-button"></span>
        if(this.props.permissions.toLowerCase() != "analytics" && this.props.permissions.toLowerCase() !== "admin"){
            analyticsAction = null
        }
        if(this.state.mainContentView === "logs"){
            if(this.state.logs.has(this.state.currentInstance.id)){
                mainView =<div className="log">
                            <div className="messages"> 
                                {this.state.logs.get(this.state.currentInstance.id).map((log, index)=>{
                                    return <div key={index} className="message">{log}</div>
                                })}
                            </div>
                        <div className="message enter" onKeyPress={this.sendMessage.bind(this)} contentEditable></div>
                    </div>
            }
        }
        if(this.state.mainContentView === "network"){

            mainView  = <NetworkTable socket={this.props.socket} instances={this.props.instances} isLoading={this.props.isLoading.bind(this)} sidebarHidden={this.state.sidebarHidden}/>
        }
        if(this.state.mainContentView === "diagnoseDevices"){
            mainView = <DiagnoseDevices socket={this.props.socket} instance={this.state.currentInstance}/>
        }

        if(this.state.mainContentView === "analytics"){
            mainView = <NetworkAnalytics socket={this.props.socket} instance={this.state.currentInstance}/>
        }

        if(this.state.mainContentView === "reports"){
            mainView = <Report socket={this.props.socket}></Report>
        }
        if(this.state.sidebarHidden === false){
            sideView = <div className="terminal-sidebar">
                
                <div className="commands">
                    <div className="header">Instances</div>
                    <select style={{marginTop: "10px"}} className="form-control" onChange={this.changeInstance.bind(this)}>
                        <option></option>
                        {this.props.instances.map((instance)=>{
                            return <option>{instance.name}</option>
                        })}
                    </select>
                    <div className="terminal-devices">
                        <Index.TerminalAccordion socket={this.props.socket} tabs={this.state.currentInstanceDevices}></Index.TerminalAccordion>
                    </div>
                    
                </div>
                </div>
        }
        return(
            <div>
                <div style={{display: "flex", flexFlow:"row",alignContent: "center"}}>
                    <div style={{display: "flex", flexFlow: "row", width: "75%", alignItems: "center"}}>
                        <span title="Reboot" style={{fontSize: "25px"}} className="fa fa-power-off font-button" onClick={this.reboot.bind(this)}></span>
                        <span title="Chat" style={{fontSize: "25px"}} className="fa fa-comments font-button"></span>
                        <span title="Logs" style={{fontSize: "25px"}} onClick={this.openLogs.bind(this)} className="fa fa-terminal font-button"></span>
                        <span title="Network" style={{fontSize: "25px"}} onClick={this.openNetwork.bind(this)} className="fa fa-cloud font-button"></span>
                        <span title="Diagnosis" style={{fontSize: "25px"}} className="fa fa-search font-button" onClick={this.diagnoseDevices.bind(this)}></span>
                        <span title="Reports" style={{fontSize:"25px"}} className="fa fa-file-text font-button" onClick={this.reports.bind(this)}></span> 
                        {analyticsAction}
                    </div>
                    <div style={{display:"flex", flexFlow: "row", justifyContent: "flex-end", width: "25%"}}>
                        <div className="hamburger">
                            <span className="fa fa-bars nav-icon" onClick={this.toggleSidebar.bind(this)}></span>
                        </div>
                    </div>
                </div>
                <div className="terminal-container">
                    <div className="terminal-main-content">
                        { mainView }
                    </div>
                    {sideView}
                </div>
                

            </div>
        )
    }
}