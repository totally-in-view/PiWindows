import React from "react";
export default class NetworkTable extends React.Component{
    constructor(props){
        super(props)
        this.instanceRefs = [];
        this.props.instances.forEach((instance)=>{
            this.instanceRefs.push(React.createRef())
        })
        this.state = {
            instances: [],
            devices: new Map(),
            loading: false,
            currentInstance: null 
        }
    }
    componentDidMount(){
        this.props.socket.on("diagnosed-devices", (devices)=>{
            
            let deviceMap = this.state.devices;
            deviceMap.set(this.state.currentInstance.id, devices);
            
            this.setState({
                loading: false,
                devices: deviceMap
            });
        });
    }
    
    static getDerivedStateFromProps(nextProps, prevState){
        this.instanceRefs = [];
        nextProps.instances.forEach((instance)=>{
            let ref = React.createRef();
            this.instanceRefs.push(ref);
        })
        this.setState({
            instances: nextProps.instances
        })
    }
    updateInstance(row, instance){
        console.log(row, instance)
        let instanceRow = row.current;
        let updatedInstance = {...instance, network: {}}
        for(const cell of instanceRow.cells){
            switch(cell.id){
                case "floor":
                    updatedInstance.network["floor"] = cell.innerText
                    break;
                case "idf":
                    updatedInstance.network["idf"] = cell.innerText
                    break;
                case "rack":
                    updatedInstance.network["rack"] = cell.innerText
                    break;
                case "patch-panel":
                    updatedInstance.network["patchPanel"] = cell.innerText
                    break;
                case "patch-panel-port":
                    updatedInstance.network["patchPanelPort"] = cell.innerText
                    break;
                case "port-label":
                    updatedInstance.network["portLabel"] = cell.innerText
                    break;
            }
        }
        this.props.socket.emit("alter-instance", {currentInstanceId: instance.id, instance: updatedInstance})
    }
    update(){
        this.props.socket.emit("update-network")
    }
    report(){
        this.props.socket.emit("download-report")
    }
    triggerReport(){
        this.props.socket.emit("trigger-report")
    }
    analyticsReport(){
        this.props.socket.emit("analytics-report")
    }
    asBuiltReport(){
        this.props.socket.emit("asBuilt-report");
    }
    diagnoseDevices(instance){
        this.props.socket.emit("diagnosis", instance);
        this.setState({
            loading: true,
            currentInstance: instance
        })
    }

    render(){
        let extraInfo = [];
        if(this.props.sidebarHidden === true){
            extraInfo = [
                <th>Floor</th>,
                <th>IDF</th>,
                <th>Rack</th>,
                <th>Patch Panel</th>,
                <th>Patch Panel Port</th>,
                <th>Port Label</th>,
            ];
        }
            return(
            <div className="network-table">
                <div className="row">
                    <div className="col-sm-12">
                        <table className="table table-hover mb-0" style={{color: "#fff"}}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Model</th>
                                    <th>MAC Address</th>
                                    {extraInfo}
                                    <th>IP Address</th>
                                    <th>Default Gateway</th>
                                    <th>Subnet Mask</th>
                                    <th>Serial Number</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.props.instances.map((instance, index)=>{
                                    let leadingZeros = "0"
                                    let extraInstanceInfo = [];

                                    if(this.props.sidebarHidden === true){
                                        if(instance.network == null){
                                            extraInstanceInfo = [
                                                <td id="floor" contentEditable></td>,
                                                <td id="idf" contentEditable></td>,
                                                <td id="rack" contentEditable></td>,
                                                <td id="patch-panel" contentEditable></td>,
                                                <td id="patch-panel-port" contentEditable></td>,
                                                <td id="port-label" contentEditable></td>
                                            ]
                                        }else{
                                            extraInstanceInfo = [
                                                <td id="floor" contentEditable>{instance.network.floor}</td>,
                                                <td id="idf" contentEditable>{instance.network.idf}</td>,
                                                <td id="rack" contentEditable>{instance.network.rack}</td>,
                                                <td id="patch-panel" contentEditable>{instance.network.patchPanel}</td>,
                                                <td id="patch-panel-port" contentEditable>{instance.network.patchPanelPort}</td>,
                                                <td id="port-label" contentEditable>{instance.network.portLabel}</td>
                                            ]
                                        }
                                    }
                                    if(instance.inspection != null){
                                        if(instance.inspection[0] != null){
                                        if(instance.inspection[0].channel.length < 2){
                                            leadingZeros = "00"
                                        }
                                        
                                        return <tr ref={this.instanceRefs[index]}>
                                                <td id="name">{instance.name}</td>
                                                <td id="model">{instance.inspection[0].model}</td>
                                                <td id="mac">{instance.inspection[0].mac}</td>
                                                {extraInstanceInfo}
                                                <td>{instance.address}</td>
                                                <td>{instance.inspection[0].defaultgateway}</td>
                                                <td>{instance.inspection[0].subnetmask}</td>
                                                <td>{instance.inspection[0].serialnumber}</td>
                                                <td>
                                                    <tbody style={{display: "flex"}}>
                                                        <span onClick={this.diagnoseDevices.bind(this, instance)} style={{display: "flex"}}className="fa fa-info-circle font-button"></span>
                                                        <span onClick={this.updateInstance.bind(this, this.instanceRefs[index], instance)} className="fa fa-pencil-square font-button"></span>
                                                    </tbody>
                                                </td>
                                            </tr>                

                                    }
                                }
                                    return <tr>
                                                <td>{instance.name}</td>
                                                <td></td>
                                                <td></td>
                                                {extraInstanceInfo}
                                                <td>{instance.address}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td><span onClick={this.diagnoseDevices.bind(this, instance)} style={{display:"flex"}}className="fa fa-info-circle font-button"></span></td>
                                            </tr>                
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="row">
                        <div className="col-sm-12" style={{textAlign: "right"}}><i style={{fontSize: "25px"}} className="fa fa-refresh font-button" onClick={this.update.bind(this)}></i></div>
                    </div>
                </div>

                {/* <div className="row">
                    <div className="col-sm-6 mt-40">
                        <button className="btn btn-primary" onClick={this.update.bind(this)}>Update Network</button>
                    </div>
                    <div className="col-sm-6 mt-40">
                        <button className="btn btn-info" onClick={this.report.bind(this)}>Download Report</button>
                    </div>
                    <div className="col-sm-6 mt-40">
                        <button className="btn btn-success" onClick={this.triggerReport.bind(this)}>Download Trigger Report</button>
                    </div>
                    <div className="col-sm-6 mt-40">
                        <button className="btn btn-danger" onClick={this.analyticsReport.bind(this)}>Download Analytics Report</button>
                    </div>
                    <div className="col-sm-6 mt-40">
                        <button className="btn btn-light" style={{color: "#333"}} onClick={this.asBuiltReport.bind(this)}>Download As Built Report</button>
                    </div>
                </div> */}
            </div>
            )
        }
}