import React from "react";
import Webview from "./WebviewScreen";
import Modal from "./Modal";
import filterMap from "./filter.json";
export default class DiagnoseDevices extends React.Component {
    constructor(props){
        super(props);
        this.props.socket.emit("get-diagnostics", this.props.instance);
        this.state = {
            devices: [],
            devicesForPresentation: [],
            filters: [],
            filter: "",
            header: [],
            event: "",
            address: null,
            modalOpen: false
        }
    }
    componentWillReceiveProps(nextProps){
        nextProps.socket.emit("get-diagnostics", nextProps.instance);
    }
    componentDidMount(){
        let event = this.props.socket.on("diagnostic-response", (diagnosis)=>{
            let filters = [];
            let {devices, busXML} = diagnosis;
            let busArr = [];
            let buses = []
            for(const xml of busXML){
                let parser = new DOMParser();
                let busDoc = parser.parseFromString(xml.busXML, "application/xml");
                let busObjs = busDoc.getElementsByTagName("Bus");
                for(var i = 0; i < busObjs.length; i++){
                    let bus = busObjs[i];
                    try{
                        busArr.push({
                            id: bus.getElementsByTagName("Bus")[0].innerHTML,
                            online: bus.getElementsByTagName("Online")[0].innerHTML,
                            locked: bus.getElementsByTagName("Locked")[0].innerHTML,
                            type: bus.getElementsByTagName("Type")[0].innerHTML
                            });
                    }catch(err){
                    }
                    
                }

                buses[xml.master] = busArr
                busArr = [];
            }
            

            devices.forEach((device)=>{
                if(filters.indexOf(device.type) == -1){
                    filters.push(device.type)
                }
                let busesForMaster = buses[device.master];
                if(busesForMaster != null){

                    let bus = busesForMaster.find(busDevice=>{
                        return busDevice.id == device.id && device.type == busDevice.type
                    });
                    if(bus !== null){
                        try{
                            device["online"] = bus["online"];
                            device["locked"] = bus["locked"];
                        }catch(err){
                        }
                        
                    }
                }
                

                
            });
            


            
            this.setState({
                filters: filters,
                devices: devices,
             
            })
        })

        this.setState({
            event: event
        })
    }

    componentWillUnmount(){
        this.props.socket.off(this.state.event);
    }

    filter(event){
        let filter = event.target.value;
        let headerMap = []
        let header = this.state.devices.find(device=>{
            return filter === filterMap[device.type]
        });
        for(var prop in header){
            if(prop === "up" || prop === "down" || prop === "hold"){

            }else{
                headerMap.push(prop)
            }
        }
        let devices = this.state.devices.filter((device)=>{
            return device.type == header.type
        });

        if(header.type == "Load"){
            devices = devices.sort((a, b)=>{
                return (a.parent + a.parentposition) - (b.parent + b.parentposition)
            })
        }
        this.setState({
            filter: header.type,
            header: headerMap,
            devicesForPresentation: devices
        })
    }

    updateStationStatus(device){
        this.props.socket.emit("update-station-status", {device: device, instance: this.props.instance})
    }

    openWebView(address){
        this.setState({
            address: address,
            modalOpen: true,
        })
    }

    closeWebView(){
        this.setState({
            address: false,
            modalOpen: false
        })
    }
    render(){
        return(
            <div>
                <Modal modalTitle={`${this.state.address} Webview`} modalIsOpen={this.state.modalOpen} close={this.closeWebView.bind(this)} modalBody={
                    <Webview address={this.state.address}/>
                }/>
                <div style={{fontWeight: "500!important", fontSize: "40px!important"}}>Devices</div>
                <select onChange={this.filter.bind(this)} className="form-control mt-10 mb-10">
                    <option>Filter</option>
                    {this.state.filters.map(filter=>{
                        if(filterMap[filter] != null){
                            return <option>{filterMap[filter]}</option>
                        }
                        return <option>{filter}</option>
                    })}
                </select>
                <div className="row">
                    <div className="col-sm-12" style={{color:"#fff"}}>
                        <table className="table table-hover mb-0" style={{color: "#fff"}}>
                            <thead>
                                <tr>
                                    {this.state.header.map(head=>{
                                        if(head !== "online"){
                                            return <th>{head}</th>
                                        }
                                        
                                    })}
                                    {((header)=>{
                                        if(header.length !== 0 || this.state.filter.toLowerCase() !== "master" && this.state.filter.toLowerCase() !== ""){
                                            return <th>Online</th>
                                        }
                                    })(this.state.header)}
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.devicesForPresentation.map((device,index)=>{
                                        let row = [];
                                        let isOnline;
                                        this.state.header.forEach((head)=>{
                                            if(head === "down" || head === "up" || head === "hold"){

                                            }
                                            else if(head === "occupancytask" || head === "vacancytask" || head === "uptask" || head === "downtask" || head === "holdtask"){
                                                try{
                                                    row.push(<td>{device[head].name}</td>)
                                                }catch(err){
                                                   row.push(<td></td>)
                                                }
                                            }else if(head === "online"){

                                            }else if(head === "params" || head === "eventObjects"){
                                                if(device[head] != null){
                                                    row.push(<td>{device[head].toString()}</td>)
                                                }
                                                
                                            }else if(head == "parenttype"){
                                                row.push(<td>{filterMap[device[head]]}</td>)
                                            }
                                            else{
                                                row.push(<td>{device[head]}</td>);
                                            }
                                            
                                        });
                                        if(device.online != null){
                                            let onlineStatus = device.online; 
                                            
                                            if(onlineStatus.includes("false")){
                                                isOnline = <span className="device-offline"></span>
                                            }else{
                                                isOnline = <span className="device-online"></span>
                                            }
                                        }else{
                                            isOnline = "N/A"
                                        }
                                        if(device.type.toLowerCase().includes("vantage.dmxdaligateway")){
                                            return <tr onClick={this.openWebView.bind(this, device.ipaddress)}>
                                                    {row}
                                                    <td>{isOnline}</td>
                                                </tr>
                                        }
                                        else if(this.state.header.indexOf("serialnumber") === -1 || device["commissioned"] === "false"){
                                            return <tr>
                                                    {row}
                                                    <td>{isOnline}</td>
                                                </tr>
                                        }
                                        else{
                                            return  <tr>
                                                        {row}
                                                        {this.state.filter.toLowerCase() !== "master" ? <td>{isOnline} <span onClick={this.updateStationStatus.bind(this, device)} style={{cursor: "pointer"}} className="fa fa-refresh"></span></td> : <td>{isOnline}</td>}
                                                    </tr>
                                        }
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}