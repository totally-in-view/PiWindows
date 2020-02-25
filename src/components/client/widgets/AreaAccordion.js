import React from "react";
import {Index} from "./index";

export default class AreaAccordion extends React.Component {
    constructor(props){
        super(props)
        var tabs = this.props.tabs;
        this.state = {
            tabs: tabs,
            searchTerm: "",
            deviceTypes: [],
            chart: null,
            initialView: this.props.filter,
            initialArea: this.props.initialArea,
            events: []
        }
    }
    
    componentWillReceiveProps(nextProps){
        var tabs = nextProps.tabs;
        if(tabs.length > 0){
            tabs.map((tab)=>{
                let devicesMap = new Map();
                if(this.state.initialArea !== null){
                    if(this.state.initialArea === tab.name){
                        tab.active = true;
                    }
                }
                for(var i = 0; i < tab.devices.length; i++){
                    if(this.props.permissions.toLowerCase() === "analytics"){
                        
                    }
                    let devices = tab.devices[i];
                    devicesMap.set(devices[0], devices[1]);
                    if(this.props.initialView !== null){
                        let data = [];
                        if(devices[0] === this.props.initialView){
                            tab.view = devices[0]; 
                            
                            devices[1].forEach((device)=>{
                                if(this.props.data !== null){
                                    this.props.data.forEach((point)=>{
                                        if(point.device === `diagnostic_${device.props.instanceId.id}_${device.props.type.toLowerCase()}_${device.props.id}`){
                                            data.push({
                                                title: device.props.name,
                                                dataPoints: point.dataPoints,
                                                color: point.color
                                            });;
                                        }
                                    })
                                }
                                
                            });
                            tab.chart = <Index.Chart type={this.props.initialView} data={data} />   
                        }
                    }
                }
                if(this.props.permissions.toLowerCase() === "client"){
                    if(tab.widgetsRight === null){
                        tab.widgetsRight = [];
                        tab.accordionBody = [];
                        tab.active = true;
                        devicesMap.forEach((value, key, map)=>{
                            
                            tab.widgetsRight.push(<div className="accordion-tab-btn">{key}</div>)
                        })
                    }
                    if(tab.widgetsRight.length === 0){
                        tab.widgetsRight = [];
                        devicesMap.forEach((value, key, map)=>{
                            tab.widgetsRight.push(<div className="accordion-tab-btn">{key}</div>)
                        })
                    }
                    tab.widgetsRight.sort((a, b)=>{
                        let x = a.props.children.toLowerCase();
                        let y = b.props.children.toLowerCase();
    
                        if(x < y){
                            return -1
                        }
                        if(x > y){
                            return 1
                        }
                        return 0
                    });
                }

                
            })
        }

        this.setState({
            tabs: tabs,
            initialView: null,
            initialArea: null
        });
    }
    toggleTab(tab, event){
        event.preventDefault();
        var newTab = tab;
        var tabs = this.state.tabs;
  
        if(newTab.active === true){
          newTab.active = false;
        }
        else{
          if(newTab.view !== "devices"){
            newTab.active = true
          }else{
              newTab.active = false;
          }
        }
        var index = tabs.findIndex(tab=>tab.name === newTab.name);
        for(var i = 0; i < tabs.length; i++){
            if(i === index){
                tabs[i] = newTab
            }else{
                tabs[i].active = false;
            }
        }
        tabs[index] = newTab;
        this.setState((prevState, props)=>({
          tabs: tabs
        }));
    }

    to(tabName, view){
        let tabs = this.state.tabs 
        let index = tabs.findIndex(tab => tab.name === tabName);

        let tab = tabs[index];
        
        tab.view = view
        
        tabs.forEach((tab_)=>{{
            if(tab_.active === true){
                tab_.active = false
            }
            if(tab_.name === tabName){
                tab_.active = true
            }
        }});
        
        tab.active = true;
        tabs[index] = tab; 
        tab.widgetsRight.forEach((widget)=>{
            if(widget.props.children.toLowerCase() === view.toLowerCase()){
                widget = <div className="accordion-tab-btn active" onClick={this.to.bind(this, tabName, view)}>{view}</div>
            }
            else{
                widget = <div className="accordion-tab-btn" onClick={this.to.bind(this, tabName, widget.props.children)}>{widget.props.children}</div>
            }
        })
        this.setState({
            tabs: tabs
        })
    }

    toScenes(tabName){
        var tabs = this.state.tabs;
        var index = tabs.findIndex(tab => tab.name === tabName)
        var tab = tabs[index];

        tab.view = "scenes";

        tabs[index] = tab;
        this.setState({
            tabs: tabs
        });
    }

    toDevices(tabName){
        var tabs = this.state.tabs;
        var index = tabs.findIndex(tab => tab.name === tabName)
        var tab = tabs[index];
        tab.view = "devices"
        tabs[index] = tab;  

        this.setState({
            tabs: tabs
        })
    }

    generateWidgets(widgets){
        var widgetUI = [];
        widgetUI = widgets.map((widget)=>{
            if(widget !== null){
                switch(widget.props.widget){
                    case "SceneButton":
                        return <Index.Scene socket = {this.props.socket} properties={widget.props} functions={widget.functions} permissions={this.props.permissions}/>
                    case "LightingWidget":
                        return <Index.LightingWidget socket={this.props.socket} properties={widget.props} functions={widget.functions} permissions={this.props.permissions}/>
                    case "HVACWidget":
                        return <Index.HVACWidget socket = {this.props.socket} properties={widget.props} functions={widget.functions} permissions={this.props.permissions}/>
                    case "ColorLightingWidget":
                        return <Index.ColorLightingWidget socket={this.props.socket} properties={widget.props} functions={widget.functions} permissions={this.props.permissions}/>
                    case "ShadeWidget":
                        return <Index.ShadeWidget socket={this.props.socket} properties={widget.props} functions={widget.functions} permissions={this.props.permissions}/>
                    default:
                        break;
                }
            }
        })

        return widgetUI;
    }

    search(event){
        var name = event.target.value;
        var areas = this.state.tabs;
        for(let area of areas){
            area.devices.forEach((deviceType)=>{
                let deviceIndex = deviceType[1].findIndex(device=>{ return device.props.name.toLowerCase().search(name.toLowerCase()) >= 0});
                if(deviceIndex > -1){
                    area.active = true;
                    area.view = deviceType[0]
                }
                else{
                    area.active = false;
                }
            });
        };
        this.setState({
            tabs: areas,
            searchTerm: event.target.value
        })
    }


    render(){
        var accordion = [];
        for(var i = 0; i < this.state.tabs.length; i++){
            var tab = this.state.tabs[i];
            if(tab.name !== "undefined"){
                if(tab.active === false){
                    var body = [];
                    if(this.props.permissions.toLowerCase() === "client"){
                        accordion.push(
                            <div className="panel panel-default">
                                <div className="panel-heading accordion-tab" role="tab" id="heading_1" onClick ={this.toggleTab.bind(this, tab)}>
                                <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name"> <div>{tab.name}</div></a> <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center"}}>{tab.widgetsRight}</div>
                                </div>
                                <div id="collapse_1" className="panel-collapse collapse" role="tabpanel" aria-expanded="false" style={{height: 0}}>
                                <div className="panel-body pa-15">{body}</div>
                                </div>
                            </div>
                            )
                    }else{
                        accordion.push(
                            <div className="panel panel-default">
                                <div className="panel-heading accordion-tab" role="tab" id="heading_1" onClick ={this.toggleTab.bind(this, tab)}>
                                <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name"> <div>{tab.name}</div></a>
                                </div>
                                <div id="collapse_1" className="panel-collapse collapse" role="tabpanel" aria-expanded="false" style={{height: 0}}>
                                <div className="panel-body pa-15">{body}</div>
                                </div>
                            </div>
                            )
                    }
                    
                }
                else{
                var body; 
                body = [];
                var row = [];
                let devices = [];
                if(this.props.permissions.toLowerCase() === "client"){
                    if(this.props.filter !== null){
                        try{
                            devices = tab.devices.find(device=>{
                                return device[0].toLowerCase() === this.props.filter.toLowerCase()
                            })[1];
                        }catch(err){
                        }
                        
                    }
                    if(devices.length > 3){
                        for(var j = 0; j < devices.length; j++){
                            row.push(devices[j]);
                            if(row.length === 4 || j === devices.length-1){
                                row = this.generateWidgets(row);
                                body.push(<div className="tab-body-row">
                                            {row}
                                            </div>);
                                row = [];
                            }   
                        }
                    }
                    else{
                        var j = 0;
                        body = [];
                        while(j < devices.length){
                            row.push(devices[j]);                            
                            j++
                        }
                        row = this.generateWidgets(row);
                        body.push(<div className="tab-body-row">{row}</div>)
                        row = []
                    }
                }else if(this.props.permissions.toLowerCase() === "analytics"){
                    tab.devices.forEach((device)=>{
                        devices = [...devices,...device[1]]
                    })

                    body = <Index.Analytics devices={devices} socket={this.props.socket} permissions={this.props.permissions} id={this.props.id}/>
                }
                
                accordion.push(
                    <div className="panel panel-default">
                    <div className="panel-heading accordion-tab" role="tab" id="heading_1" onClick={this.toggleTab.bind(this, tab)} style={{justifyContent: "space-between"}}>
                    <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name accordion-tab-active"> <div>{tab.name}</div></a> <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center"}}>{tab.widgetsRight}</div>
                    </div>
                    <div id="collapse_1" className="panel-collapse collapse in" role="tabpanel" aria-expanded="true">
                        <div className="panel-body pa-15 accordion-body">{body}</div>
                    </div>
                    </div>
                    )
            }   
        }
    }


        return(
            <div>
                <div className="row">
                    <div className="col-sm-12">
                        <input onChange={this.search.bind(this)} value={this.state.searchTerm} style={{margin: "25px"}}type="text" className="form-control filled-input rounded-input" placeholder="Search Device Name"/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <div className="panel-group accordion-struct" id="accordion_1" role="tablist" aria-multiselectable="true">
                            {accordion}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}