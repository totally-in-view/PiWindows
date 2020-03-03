import React from "react";

export default class DeviceSettings extends React.Component {
    constructor(props){
        super(props);

        this.deviceRefs = [];
        this.newRow = React.createRef();
        this.state = {
            devices: [],
            numberOfEntries: 1,
            currentPage: 1
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        return this.state.devices !== nextState.devices
    }
    UNSAFE_componentWillMount(){
        this.props.socket.on("updated-file", (file)=>{
            this.props.updateFile(file);
        })
    }
    componentDidMount(){
        this.props.socket.emit("get-devices", null);

        this.props.socket.on("devices-returned", (devices, numberOfEntries)=>{
            this.deviceRefs = [];
            devices.forEach((device)=>{
                this.deviceRefs.push(React.createRef());
            })
            this.setState({
                devices: devices,
                numberOfEntries: numberOfEntries
            })
        })
    }
    UNSAFE_componentWillReceiveProps(nextProps){
        this.deviceRefs = [];
        // nextProps.devices.forEach((device)=>{
        //     this.deviceRefs.push(React.createRef());
        // });

    }
    createDevice(event){
        let newRow = this.newRow.current;
        // console.log(newRow.cells)
        let device = {
            props:{
                id: 0,
                type: "",
                area: "",
                name: "",
                instanceId: {},
                instanceAlias: ""
            }
            
        }
        for(let cell of newRow.cells){
            switch(cell.id){
                case "id":
                    device.props.id = parseInt(cell.innerText)
                    break;
                case "driver":
                    device.props.type = cell.firstChild.value
                    break;
                case "area":
                    device.props.area = cell.innerText;
                    break;
                case "name":
                    device.props.name = cell.innerText;
                    break;
                case "instance":
                    let instance = cell.firstChild.value;
                    this.props.instances.forEach((piInstance)=>{
                        piInstance.aliases.forEach((alias)=>{
                            if(`${piInstance.name} - ${alias}` === instance){
                                device.props.instanceId = piInstance
                                device.props.instanceAlias = alias
                            }
                        });
                    });
                default:
                    
                    break;
            }
        }
        // console.log(device);
        this.props.socket.emit("create-device", device);
    }
    updateDevice(row){
        let currentRow = row.current;
        let device = {
            props:{
            name: "",
            id: 0,
            type: "",
            area: "",
            instanceId: "",
            instanceAlias: ""
        }}
        for(let cell of currentRow.cells){
            switch(cell.id){
                case "id":
                    device.props.id = parseInt(cell.innerText)
                    break;
                case "driver":
                    device.props.type = cell.firstChild.value
                    break;
                case "area":
                    device.props.area = cell.innerText;
                    break;
                case "name":
                    device.props.name = cell.innerText;
                    break;
                case "instance":
                    let instance = cell.firstChild.value;
                    this.props.instances.forEach((piInstance)=>{
                        if(piInstance.aliases.length > 0){
                            piInstance.aliases.forEach((alias)=>{
                                if(`${piInstance.name} - ${alias}` == instance){
                                    device.props.instanceId = piInstance
                                    device.props.instanceAlias = alias
                                }
                            });
                        }else if(piInstance.name == instance){
                            device.props.instanceId = piInstance
                        }
                    });
                default:
                    break;
            }
        }
        // console.log(device);
        // console.log(currentRow.id);
        this.props.socket.emit("alter-device", {
            currentdeviceId: currentRow.id,
            device: device
        })
    }

    deleteDevice(device){

        this.props.socket.emit("delete-device", device);
    }

    toFirstPage(){
        this.props.socket.emit("get-request", 1);
        this.setState({
            currentPage: 1
        })
    }

    toLastPage(){
        this.props.socket.emit("get-devices", Math.ceil(this.state.numberOfEntries/50));
        this.setState((prevState, props)=>({
            currentPage: Math.ceil(prevState.numberOfEntries/50)
        }))
    }
    nextPage(){
        var nextPage =this.state.currentPage+1;
        console.log(nextPage)
        if(Math.ceil(this.state.numberOfEntries/50) >= nextPage){
            this.props.socket.emit("get-devices", nextPage);
            this.setState((prevState, props)=>({
                currentPage: nextPage
            }))
        }
    }

    previousPage(){
        var previousPage = this.state.currentPage-1;
        if(previousPage > 0){
            console.log(previousPage);
            this.props.socket.emit("get-devices", previousPage);
            this.setState(({
                currentPage: previousPage
            }))
        }
    }

    toCertainPage(pageNumber){
        console.log(pageNumber);
        this.props.socket.emit("get-devices", parseInt(pageNumber));
        this.setState({
            currentPage: pageNumber
        })
    }
    render(){
        let pagination = [];
        pagination.push(<li onClick={this.toFirstPage.bind(this)}><a>{"<<"}</a></li>)
        pagination.push(<li onClick={this.previousPage.bind(this)}><a>{"<"}</a></li>);
        pagination.push(<li><a>{"..."}</a></li>);

        let totalPages = Math.ceil(this.state.numberOfEntries/50);
        if(totalPages < 25){
            for(let i = 0; i < totalPages; i++){
                if(i == this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }    
        }else{
            let upperLimit = totalPages >  this.state.currentPage+12 ? this.state.currentPage+12 : totalPages;
            let lowerLimit = this.state.currentPage < 12 ? 0 : this.state.currentPage-12

            if(upperLimit + lowerLimit < 24){
                upperLimit += 24 - (upperLimit-lowerLimit)
            }
            for(var i = lowerLimit; i < upperLimit; i++ ){
                if(i == this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else if(i < 0){
    
                }
                else if(i > totalPages){

                }
                else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }

        }
        pagination.push(<li><a>{"..."}</a></li>);
        pagination.push(<li onClick={this.nextPage.bind(this)}><a>{">"}</a></li>)
        pagination.push(<li onClick={this.toLastPage.bind(this)}><a>{">>"}</a></li>)

            return(
            <div>
                <div className="col-sm-12">
                    <table id="edit_datatable_1"className="table table-hover mb-0" style={{color: "#fff"}}>
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>Id</th>
                                <th>Name</th>
                                <th>Instance</th>
                                <th>Area</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            {
                                this.state.devices.map((device, index)=>{
                                    return <tr ref={this.deviceRefs[index]} id={device.props.id}>
                                        <td id="driver" className="editable-col">
                                            <select className="form-control" defaultValue={device.props.type}>
                                               <option></option>
                                               {this.props.drivers.map((driver, index)=>{
                                                   return <option>{driver.props.type}</option>
                                               })}
                                            </select>
                                        </td>
                                        <td id="id" className="editable-col" contentEditable>{device.props.id}</td>
                                        <td id="name" className="editable-col" contentEditable>{device.props.name}</td>
                                        {((device, instances)=>{
                                            if(device.props.instanceAlias == ""){
                                                return(
                                                    <td id="instance" className="editable-col">
                                                        <select className="form-control" defaultValue={`${device.props.instanceId.name}`}>
                                                        <option></option>
                                                        {instances.map((instance, index)=>{
                                                            if(instance.aliases.length != 0){
                                                                return instance.aliases.map(alias=>{
                                                                    return <option>{instance.name} - {alias}</option>
                                                                })
                                                            }else{
                                                                    return <option>{instance.name}</option>
                                                            }
                                                            
                                                        })}
                                                        </select>
                                                    </td>
                                                )
                                            }
                                            return (
                                            <td id="instance" className="editable-col">
                                                <select className="form-control" defaultValue={`${device.props.instanceId.name} - ${device.props.instanceAlias}`}>
                                                <option></option>
                                                {instances.map((instance, index)=>{
                                                    if(instance.aliases.length != 0){
                                                        return instance.aliases.map(alias=>{
                                                            return <option>{instance.name} - {alias}</option>
                                                        })
                                                    }else{
                                                            return <option>{instance.name}</option>
                                                    }
                                                    
                                                })}
                                                </select>
                                            </td>
                                            )
                                        })(device, this.props.instances)}
                                        <td id="area" className="editable-col" contentEditable>{device.props.area}</td>
                                        <td><span onClick={this.updateDevice.bind(this, this.deviceRefs[index])} className="fa fa-pencil-square font-button"></span>
                                            <span onClick={this.deleteDevice.bind(this, device)}className="fa fa-minus-square font-button"></span></td>
                                    </tr>
                                })
                            }
                            <tr ref={this.newRow}>
                                <td id="driver" className="editable-col">
                                    <select className="form-control">
                                        {this.props.drivers.map((driver, index)=>{
                                            return <option>{driver.props.type}</option>
                                        })}
                                    </select>
                                </td>
                                <td id="id" contentEditable></td>
                                <td id="name" className="editable-col" contentEditable></td>
                                <td id="instance" className="editable-col">
                                    <select className="form-control">
                                        <option></option>
                                        {this.props.instances.map((instance, index)=>{
                                            if(instance.aliases.length != 0){
                                                return instance.aliases.map(alias=>{
                                                    return <option>{instance.name} - {alias}</option>
                                                });
                                            }else{
                                                return <option>{instance.name}</option>
                                            }
                                        })}
                                    </select>
                                </td>
                                <td id="area" className="editable-col" contentEditable></td>
                                <td>
                                    <span onClick={this.createDevice.bind(this)} className="fa fa-plus-square font-button"></span>
                                </td>
                            </tr>
                    </table>  
                </div>
                <div className="row">
                        <div className="col-sm-12" style={{display: "flex", flexFlow: "row", justifyContent: "center"}}>
                            <ul className="pagination pagination-lg mt-0 mb-0 mr-15">
                                {pagination.map(item=>{
                                    return item
                                })}
                            </ul>
                        </div>
                </div>
            </div>
            )
    }
}