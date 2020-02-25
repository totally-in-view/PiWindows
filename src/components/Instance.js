import React from 'react';
import {Index} from "./client/widgets/index";
import queryString from "query-string";
import Panel from "./Panel"

export default class Instance extends React.Component{
    constructor(props){
        super(props)
        let params = queryString.parse(this.props.location.search);
        this.props.socket.emit("get-instance-devices-from-db", {id: this.props.id, alias: this.props.alias}, params.area)
        
        this.state = {
            tabs: [],
            status: <i onClick={this.refresh.bind(this)} className="fa fa-desktop online"></i>,
            data: [],
            listeners: [],
            types: [],
            filter: null
        }
    }

    componentWillReceiveProps(nextProps){
        if(this.props.id !== nextProps.id){
            let params = queryString.parse(nextProps.location.search);
            nextProps.socket.emit("get-instance-devices-from-db", {id: nextProps.id, alias: nextProps.alias}, params.area);
            this.setState({
                tabs: []
            })
        }
    }

    componentDidMount(){
        let params = queryString.parse(this.props.location.search);

        this.props.socket.emit("get-pi-devices", this.props.id, params.area);
        let listeners = this.state.listeners
        let instanceStatusListener = this.props.socket.on(`instance-${this.props.id}-status`, (status)=>{
            if(status === "online"){
                this.setState({
                    status: <i onClick={this.refresh.bind(this)} className="fa fa-desktop online"></i>
                })
            }else{
                this.setState({
                    status: <i onClick={this.refresh.bind(this)} className="fa fa-desktop offline"></i>
                })
            }
        });
        let instanceDevicesListener = this.props.socket.on(`getting-instance-${this.props.id}-devices`, (msg)=>{
            var tabs = this.state.tabs;
            var tabIndex = tabs.findIndex(tab=>{ return tab.name === msg.name})
            let types = this.state.types
            if(tabIndex === -1){
                msg.devices.forEach((deviceType)=>{
                    if(types.indexOf(deviceType[0]) < 0){
                        types.push(deviceType[0]);
                    }
                })
                var tab = {
                    name: msg.name,
                    widgetsRight: [],
                    widgetsLeft: [],
                    view: "",
                    active: false,
                    devices: msg.devices,
                    scenes: msg.scenes
                }

                tabs.push(tab)

                this.setState({
                    tabs: tabs,
                    types: types,
                    filter: types[0]
                })
            }
            else{
                var tab = tabs[tabIndex];
                tab.devices = msg.devices
                tab.scenes = msg.scenes
                msg.devices.forEach((deviceType)=>{
                    if(types.indexOf(deviceType[0]) < 0){
                        types.push(deviceType[0]);
                    }
                })
                tabs[tabIndex] = tab;

                this.setState({
                    tabs: tabs,
                    types: types,
                    filter: types[0]
                })
            }
            
        });

        let deviceResponseListener = this.props.socket.on("pi-devices-response", (data)=>{
            this.setState({
                data: data
            })
        })

        listeners = [deviceResponseListener, instanceDevicesListener, instanceStatusListener];

        this.setState({
            listeners: listeners
        })
    }

    componentWillUnmount(){
        this.state.listeners.forEach((listener)=>{
            this.props.socket.off(listener);
        })
    }
    refresh(){

        this.props.socket.emit(`restart-instance`, this.props.id)
        this.setState({
            status: <i className= "fa fa-spin fa-refresh refresh"></i>
        })
    }

    changeFilter(type){
        this.setState({
            filter: type
        })
    }

    render(){
        let params = new URLSearchParams(this.props.location.search);
        let alias = ""
       
        if(this.props.alias !== undefined){
            alias = `: ${this.props.alias}`
        }
        return(
            <Panel header={<div style={{borderBottom: "1px solid ivory", display: "flex"}}>
                                <div style={{paddingBottom: "10px", width: "75%" }}>{this.state.status}{`${this.props.name}${alias}`}</div>
                                {((permission)=>{
                                    if(permission == "client"){
                                        return <div style={{display: "flex"}}>{this.state.types.map((type)=>{
                                            if(type === this.state.filter){
                                                return <div className="type-tab-active" onClick={this.changeFilter.bind(this, type)}>{type}</div>
                                            }
                                            return <div className="type-tab" onClick={this.changeFilter.bind(this, type)}>{type}</div>
                                        })}</div>
                                    }
                                     })(this.props.permissions)}
                            </div>} body={<Index.Accordion socket={this.props.socket} initialView={params.get("deviceType")} tabs={this.state.tabs} data={this.state.data} permissions={this.props.permissions} id={this.props.id} filter={this.state.filter}/>}/>
        )
    }
}