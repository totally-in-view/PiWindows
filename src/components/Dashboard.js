import React from "react";
import Panel from "./Panel";
import {Index} from "./client/widgets/index";
export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
        if(this.props.file != null ){
            if(this.props.file.instances != null){
                if(this.props.file.instances.length == 1){
                    this.props.socket.emit("get-areas", this.props.file.instances[0]);
                }
            }
        }
        
        this.state = {
            areas: [],
            instancesOnline: [],
            instancesOffline: [],
            file: this.props.file,
            listeners: [],
            currentAreasPage: 1,
            maxAreas: 1,
            currentInstance: null,
        }
    }
    
    UNSAFE_componentWillReceiveProps(nextProps){
        let file = nextProps.file;

        file.instances.forEach((instance)=>{
            instance.active = "inactive"
        })
        this.setState({
            file: file,
            areas: [],
            maxAreas: 1,
            currentAreasPage: 1
        });
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.state.areas != nextState.areas
    }
    componentDidMount(){
        let listeners = this.state.listeners; 
        
        this.props.socket.on("get-instances", (instances)=>{
            
        })
        let listener = this.props.socket.on("areas-returned", (areas, maxAreas)=>{
            this.setState({
                areas: areas,
                maxAreas: Math.ceil(maxAreas/12)
            })
        });
        listeners.push(listener)
       
        this.setState({
            listeners: listeners
        })

    }

    componentDidUpdate(){
    }
    toInstance(instance, alias,filter=null){
        if(filter === null && alias === null){
            this.props.to(instance);
        }else if(filter === null && alias != null){
            this.props.to(alias)
        }else if(filter != null && alias === null){
            console.log(filter);
            this.props.to(instance, filter)
        }else{
            console.log(filter);
            this.props.to({screen: instance, filter: filter, alias: alias }, filter.name)
        }
    }

    getAreas(instance, alias=null, event){
        
        let file = this.state.file;
        file.instances.forEach((fileInstance)=>{
            if(fileInstance.id === instance.id && event === null){
                fileInstance.active = "active"
            }else if(fileInstance.id != instance.id){
                fileInstance.active = "inactive"
            }else if(event != null){
                if(fileInstance.id === instance){
                    if(fileInstance.aliases.indexOf(alias) > -1){
                        fileInstance.activeAlias = alias
                    }
                }
            }
        });
        if(event != null){
            this.props.socket.emit("get-areas", instance, alias);
        }else{
            this.props.socket.emit("get-areas", instance)
        }
        if(event != null){
            this.setState({
                file: file,
                activeAlias: alias,
                currentInstance: instance,
                currentAreasPage: 1
            });
        }else{
            this.setState({
                file: file,
                currentInstance: instance,
                currentAreasPage: 1
            })
        }
    }

    nextAreas(){
        if(this.state.currentAreasPage !== this.state.maxAreas){
            this.props.socket.emit("get-areas", this.state.currentInstance, this.state.activeAlias, this.state.currentAreasPage+1);
            let currentPage = this.state.currentAreasPage;
            this.setState({
                currentAreasPage: currentPage+1
            })
        }
    }

    previousAreas(){
        if(this.state.currentAreasPage !== 1){
            this.props.socket.emit("get-areas", this.state.currentInstance, this.state.activeAlias, this.state.currentAreasPage -1);
            let currentPage = this.state.currentAreasPage;
            this.setState({
                currentAreasPage: currentPage-1
            })
        }
    }

    toCertainAreaPage(page){
        this.props.socket.emit("get-areas", this.state.currentInstance, this.state.activeAlias, page);
        this.setState({
            currentAreasPage: page
        })
    }
    render(){
        let paginationCircles = []
        if(this.state.areas.length != 0 || this.state.maxAreas != 1){
            for(var i = 1; i <= this.state.maxAreas; i++){
                if(i === this.state.currentAreasPage){
                    paginationCircles.push(<div onClick={this.toCertainAreaPage.bind(this, i)} className="pi-card-pagination active"/>)
                }
                else{
                    paginationCircles.push(<div onClick={this.toCertainAreaPage.bind(this, i)} className="pi-card-pagination" />);
                }
            }
        }
        let leftarrow = ""; 
        let rightarrow = ""; 
        if(this.state.areas.length === 0){
            leftarrow = "hidden"
            rightarrow = "hidden"
        }else{
            if(this.state.currentAreasPage === 1){
                leftarrow = "hidden"
            }
            if(this.state.currentAreasPage === this.state.maxAreas){
                rightarrow = "hidden"
            }
        }

        return (
            <div>
                <Panel header={"Dashboard"} body={<div>

                    <div className="col-sm-12">
                        <div className="panel-group accordion-struct">
                            {this.state.file.instances.map((instance)=>{
                                if(instance.aliases.length === 0){
                                    if(this.state.currentInstance === instance){
                                        return <div className="panel panel-default">
                                                    <div onClick={this.getAreas.bind(this, instance)}className="panel-heading accordion-tab" style={{justifyContent: "center"}}>
                                                    <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name accordion-tab-active"> <div>{instance.name}</div></a>
                                                    </div>
                                                    <div className="panel-collapse collapse in">
                                                        <div className="panel-body pa-15 accordion-body">
                                                            <div style={{display: "flex", flexFlow: "row wrap", width: "100%", justifyContent: "space-evenly"}}>
                                                            <div style={{alignSelf: "center", justifySelf: "flex-start", visibility: leftarrow}}><span onClick={this.previousAreas.bind(this)}className="fa fa-arrow-circle-o-left fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                                                            <div style={{display:"flex", flexFlow: "row wrap",width: "65%"}}>{this.state.areas.map((area)=>{
                                                                if(area.name != "undefined"){
                                                                    return <div className="pi-card md"  >
                                                                                <div style={{cursor: "pointer"}} onClick={this.toInstance.bind(this, area.instanceName, area.instanceAlias, {area: area.id})} className="pi-card-title">{area.name}</div>
                                                                                <div style={{display: "flex", flexFlow: "row"}}>
                                                                                {((lights)=>{
                                                                                    if(lights.length > 0){
                                                                                        return <Index.LightDonut lights={lights} instance={area.instanceName} alias={area.instanceAlias} areaName = {area.name} socket={this.props.socket} permissions={"client"}/>
                                                                                    }
                                                                                })(area.lights)}
                                    
                                                                                {((thermostats)=>{
                                                                                    if(thermostats.length > 0){
                                                                                        return <Index.TempDonut thermostats={thermostats} instance={area.instanceName} areaName = {area.name} socket={this.props.socket} />
                                                                                    }
                                                                                })(area.thermostats)}
                                                                                </div>
                                                                            </div>
                                                                }
                                                                
                                                            })}</div>
                                                            <div style={{alignSelf: "center", justifySelf:"flex-end", visibility: rightarrow}}><span onClick={this.nextAreas.bind(this)}className="fa fa-arrow-circle-o-right fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                                    
                                                        </div>
                                                        <div style={{display: "flex", justifyContent: "center"}}>
                                                            {paginationCircles}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>
                                    }
                                    return <div className="panel panel-default">
                                                <div onClick={this.getAreas.bind(this, instance)} className="panel-heading accordion-tab" style={{justifyContent: "center"}}>
                                                <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name"> <div>{instance.name}</div></a>
                                                </div>
                                            </div>
                                    
                                }else{
                                    if(this.state.currentInstance.name === instance.name){
                                        let alias = this.state.currentInstance.aliases.find((instanceAlias)=>{
                                            return instanceAlias == this.state.activeAlias
                                        })
                                        return <div className="panel panel-default">
                                                    <div onClick={this.getAreas.bind(this, instance)}className="panel-heading accordion-tab" style={{justifyContent: "center"}}>
                                                    <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name accordion-tab-active"> <div>{instance.name} : {alias}</div></a>
                                                    </div>
                                                    <div className="panel-collapse collapse in">
                                                        <div className="panel-body pa-15 accordion-body">
                                                            <div style={{display: "flex", flexFlow: "row wrap", width: "100%", justifyContent: "space-evenly"}}>
                                                            <div style={{alignSelf: "center", justifySelf: "flex-start", visibility: leftarrow}}><span onClick={this.previousAreas.bind(this)}className="fa fa-arrow-circle-o-left fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                                                            <div style={{display:"flex", flexFlow: "row wrap",width: "65%"}}>{this.state.areas.map((area)=>{
                                                                if(area.name != "undefined"){
                                                                    return <div className="pi-card md">
                                                                                <div style={{cursor: "pointer"}} onClick={this.toInstance.bind(this, area.instanceName, area.instanceAlias, {area: area.name})} className="pi-card-title">{area.name}</div>
                                                                                <div style={{display: "flex", flexFlow: "row"}}>
                                                                                {((lights)=>{
                                                                                    if(lights.length > 0){
                                                                                        return <Index.LightDonut lights={lights} instance={area.instanceName} alias={area.instanceAlias} areaName = {area.name} socket={this.props.socket} />
                                                                                    }
                                                                                })(area.lights)}
                                    
                                                                                {((thermostats)=>{
                                                                                    if(thermostats.length > 0){
                                                                                        return <Index.TempDonut thermostats={thermostats} instance={area.instanceName} areaName = {area.name} socket={this.props.socket} />
                                                                                    }
                                                                                })(area.thermostats)}
                                                                                </div>
                                                                            </div>
                                                                }
                                                                
                                                            })}</div>
                                                            <div style={{alignSelf: "center", justifySelf:"flex-end", visibility: rightarrow}}><span onClick={this.nextAreas.bind(this)}className="fa fa-arrow-circle-o-right fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                                    
                                                        </div>
                                                        <div style={{display: "flex", justifyContent: "center"}}>
                                                            {paginationCircles}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>
                                    }else{
                                        instance.aliases.map((alias)=>{
                                            return <div className="panel panel-default">
                                                <div onClick={this.getAreas.bind(this, instance, alias)} className="panel-heading accordion-tab" style={{justifyContent: "center"}}>
                                                <a role="button" data-toggle="collapse" data-parent="#accordion_1" aria-expanded="true" className="collapsed accordion-tab-name"> <div>{instance.name} : {instance.alias}</div></a>
                                                </div>
                                            </div>
                                        })
                                    }
                                    
                                    
                                }
                            })}
                        </div>
                    
                    </div>
                    {/* <div style={{display: "flex", flexFlow: "row nowrap", overflowX: "scroll"}}>
                            {this.state.file.instances.map((instance)=>{
                                let index = this.props.instancesStatuses.offline.findIndex(offlineInstance=>{
                                    return instance.id === offlineInstance.id
                                })

                                if(index === -1){
                                    if(instance.aliases.length === 0){
                                        return <div style={{cursor: "pointer"}}className={`pi-card md ${instance.active}`} onClick={this.getAreas.bind(this, instance)}>
                                                <div className="pi-card-title">{instance.name}</div>
                                            </div>
                                    }else{
                                        let aliasTiles = []
                                        instance.aliases.forEach((alias)=>{
    
                                            if(alias === this.state.activeAlias){
                                                aliasTiles.push(<div style={{cursor: "pointer"}} className={`pi-card md active`} onClick={this.getAreas.bind(this, instance, alias)}>
                                                                <div className="pi-card-title">{alias}</div>
                                                            </div>);
                                            }else{
                                                aliasTiles.push(<div style={{cursor: "pointer"}} className={`pi-card md inactive`} onClick={this.getAreas.bind(this, instance, alias)}>
                                                <div className="pi-card-title">{alias}</div>
                                            </div>);
                                            }
                                           
                                        })
                                            return aliasTiles
                                    }
                                }
                                else{
                                    if(instance.aliases.length === 0){
                                        return <div className={`pi-card md ${instance.active} offline`}>
                                                <div className="pi-card-title">{instance.name}</div>
                                            </div>
                                    }else{
                                        let aliasTiles = []
                                        instance.aliases.forEach((alias)=>{
    
                                            if(alias === this.state.activeAlias){
                                                aliasTiles.push(<div className={`pi-card md offline`}>
                                                                <div className="pi-card-title">{alias}</div>
                                                            </div>);
                                            }else{
                                                aliasTiles.push(<div className={`pi-card md offline`}>
                                                <div className="pi-card-title">{alias}</div>
                                            </div>);
                                            }
                                           
                                        })
                                            return aliasTiles
                                    }
                                }
                                
                            })}
                    </div>

                    <div style={{display: "flex", flexFlow: "row wrap", width: "100%", justifyContent: "space-evenly"}}>
                        <div style={{alignSelf: "center", justifySelf: "flex-start", visibility: leftarrow}}><span onClick={this.previousAreas.bind(this)}className="fa fa-arrow-circle-o-left fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                        <div style={{display:"flex", flexFlow: "row wrap",width: "65%"}}>{this.state.areas.map((area)=>{
                            if(area.name != "undefined"){
                                return <div className="pi-card md"  >
                                            <div style={{cursor: "pointer"}} onClick={this.toInstance.bind(this, area.instanceName, area.instanceAlias, {area: area.name})} className="pi-card-title">{area.name}</div>
                                            <div style={{display: "flex", flexFlow: "row"}}>
                                            {((lights)=>{
                                                if(lights.length > 0){
                                                    return <Index.LightDonut lights={lights} instance={area.instanceName} alias={area.instanceAlias} areaName = {area.name} socket={this.props.socket} />
                                                }
                                            })(area.lights)}

                                            {((thermostats)=>{
                                                if(thermostats.length > 0){
                                                    return <Index.TempDonut thermostats={thermostats} instance={area.instanceName} areaName = {area.name} socket={this.props.socket} />
                                                }
                                            })(area.thermostats)}
                                            </div>
                                        </div>
                            }
                            
                        })}</div>
                        <div style={{alignSelf: "center", justifySelf:"flex-end", visibility: rightarrow}}><span onClick={this.nextAreas.bind(this)}className="fa fa-arrow-circle-o-right fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>

                    </div>
                    <div style={{display: "flex", justifyContent: "center"}}>
                    {paginationCircles}
                </div> */}
                </div>}/>
            </div> 
        )
    }
}

Dashboard.defaultProps = {
    file: {
        instances: [],
        devices: []
    }
}