import React from "react";
import {Index} from "./index";

export default class Terminal extends React.Component {
    constructor(props){
        super(props)
        var tabs = this.props.tabs;
        this.state = {
            tabs: tabs,
            filters: [],
            filter: ""
        }
    }
    
    componentWillReceiveProps(nextProps){
        var tabs = nextProps.tabs;
        var filters = this.state.filters;
        if(tabs.length > 0){
            Promise.all(tabs.map((tab)=>{
                tab.devices.forEach((device)=>{
                    if(filters.indexOf(device[0]) < 0){
                        filters.push(device[0]);
                    }
                })
            }));
        }
        if(this.state.tabs.length != tabs.length){
            this.setState({
                tabs: tabs,
                filters: filters
            });
        }
    }
    toggleTab(tab, event){
        event.preventDefault();
        var newTab = tab;
        var tabs = this.state.tabs;
  
        if(newTab.active === true){
          newTab.active = false;
        }
        else{
          newTab.active = true
        }
        var index = tabs.findIndex(tab=>tab.name === newTab.name);
        for(var i = 0; i < tabs.length; i++){
            if(i === index){
                tabs[i] = newTab
            }else{
                tabs[i].active = false;
            }
        }
        this.setState({
          tabs: tabs
        });
    }

    generateWidgets(widgets){
        var widgetUI = [];
       
        widgetUI = widgets.map((widget)=>{
                if(widget != null){
                    switch(widget.props.widget){
                        case "SceneButton":
                            return <Index.Scene socket = {this.props.socket} properties={widget.props} functions={widget.functions} terminalMode={true} />
                        case "LightingWidget":
                            return <Index.LightingWidget socket={this.props.socket} properties={widget.props} functions={widget.functions} terminalMode={true}/>
                        case "HVACWidget":
                            return <Index.HVACWidget socket = {this.props.socket} properties={widget.props} functions={widget.functions} terminalMode={true}/>
                        case "ColorLightingWidget":
                            return <Index.ColorLighting socket={this.props.socket} properties={widget.props} functions={widget.functions} terminalMode={true}/>
                        case "ShadeWidget":
                            return <Index.ShadeWidget socket={this.props.socket} properties={widget.props} functions={widget.functions} terminalMode={true}/>
                        default:
                            break;
                    }
                }
        })
        return widgetUI;
    }

    addFilter(event){
        this.setState({
            filter: event.target.value
        })
    }
    render(){
        var accordion = [];
        let tabs = this.state.tabs.filter( tab=>{
            let devices = tab.devices.find(device=>{
                return device[0] === this.state.filter
            });
            return devices != null
        }
        )
        for(var i = 0; i < tabs.length; i++){
            var tab = tabs[i];
            if(tab.name != "undefined"){
                if(tab.active === false){
                    var body = [];
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
                  else{
                    var body = [];
                    
                    let tabDevices = tab.devices.find(device=>{
                        return device[0] === this.state.filter
                    });
                    let devices = []
                    if(tabDevices != null){
                        devices = devices[1]
                    }
                    //
                    if(!this.state.filter.includes("Scene")){ 
                        let row = [];
                        
                        if(devices.length > 2){
                            for(var j = 0; j < devices.length; j++){
                                row.push(devices[j]);
                                if(row.length === 2 || j === devices.length-1){
                                    row = this.generateWidgets(row);
                                    body.push(<div className="tab-body-row">{row}</div>);
                                    row = [];
                                }   
                            }
                        }
                        else{
                            let row = [];
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
                    }else{
                        if(devices.length > 2){
                            let row = [];
                            for(var j = 0; j < devices.length; j++){
                                row.push(devices[j]);
                                if(row.length === 2 || j === devices.length-1){
                                    row = this.generateWidgets(row);
                                    body.push(<div className="tab-body-row">{row}</div>);
                                    row = [];
                                }   
                            }
                        }
                        else{
                            let row = [];
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
                    }
                    accordion.push(
                        <div className="panel panel-default">
                        <div className="panel-heading accordion-tab" role="tab" id="heading_1" onClick={this.toggleTab.bind(this, tab)}>
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
                        <select className="form-control mb-10" onChange={this.addFilter.bind(this)}>
                            <option>Filter By</option>
                            {this.state.filters.map((filter)=>{
                                return <option>{filter}</option>
                            })}
                        </select>
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