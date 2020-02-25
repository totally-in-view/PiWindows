import React from "react";
import {Redirect} from "react-router-dom";

export default class DriverBinder extends React.Component{
    
    constructor(props){
        super(props);

        
        this.state = {
            driver: "",
            driverPropToBind: "",
            devicePropToBind: "",
            instanceToBind: "",
            bindPreview: {}
        }
    }
    
    driverBound(event){
        this.setState({
            driver: event.target.value
        })
    }

    driverPropToBind(event){
        this.setState({
            driverPropToBind: event.target.value
        })
    }

    devicePropToBind(event){
        this.setState({
            devicePropToBind: event.target.value
        })
    }

    instanceToBind(event){
        var instanceName = event.target.value

        this.props.instances.forEach((instance)=>{
            if(instanceName == instance.name){
                this.setState({
                    instanceToBind: instance
                })
            }
        })
    }
    bindPreview(){
        var preview = this.state.bindPreview;

        preview[this.state.driverPropToBind] = this.state.devicePropToBind;
        
        this.setState({
            driverPropToBind: "",
            devicePropToBind: "",
            bindPreview: preview
        })
    }

    async bind(){
        var driverSelected;

        this.props.drivers.forEach((driver)=>{
            if(this.state.driver == driver.props.type){
                driverSelected = driver;
            }
        });
        var deviceProps = Object.getOwnPropertyNames(this.state.bindPreview);
        console.log(deviceProps)
        for(const device of this.props.devices){

            var deviceBound = {...driverSelected};
            deviceProps.forEach((deviceProp)=>{
                var prop = this.state.bindPreview[deviceProp];
                deviceBound.props[prop] = device[deviceProp];
                console.log(`Phoenix Device Prop: ${prop}\n Native Device Prop: ${deviceProp}\n Phoenix Device Prop-Value: ${deviceBound.props[prop]}\n Native Device Prop: ${device[deviceProp]}`)
            })
            deviceBound.props.instanceId = this.state.instanceToBind.id
            await this.props.add(deviceBound);
            
        }
        
    }
    render(){
        var driversUI = [];
        var propsForBinding;
        var driverPropsUI = [];
        var devicePropsUI = []
        var instanceUI = []
        console.log(this.props);
        this.props.drivers.forEach((driver)=>{
            driversUI.push(<option>{driver.props.type}</option>)
            if(this.state.driver == driver.props.type){
                propsForBinding = driver.props
            }
        })

        this.props.instances.forEach((instance)=>{
            instanceUI.push(<option>{instance.name}</option>)
        })

        var propsFromDevice = this.props.devices[0];
        
        for(var prop in propsForBinding){
            driverPropsUI.push(<option>{prop}</option>);
        }

        for(var prop in propsFromDevice){
            devicePropsUI.push(<option>{prop}</option>);
        }
        return(
        <div className="modal fade bs-example-modal-lg in" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true" style={{display: "block"}}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" data-dismiss="modal" aria-hidden="true" onClick={this.props.close.bind(this, false, <Redirect to="/add-device/review"/>)}>×</button>
                        <h5 className="modal-title" id="myLargeModalLabel">Driver Binder</h5>
                    </div>
                    <div className="modal-body">
                                <div className="driver-binder-configs">
                                   <div style={{display: "flex", justifyContent: "space-around"}}>
                                       <label className="control-label mb-10">Driver</label>
                                        <select className="form-control" onChange={this.driverBound.bind(this)}>
                                            <option></option>
                                            
                                        </select>
                                        <label className="control-label mb-10">Driver Props</label>
                                        <select className="form-control"onChange={this.driverPropToBind.bind(this)}>
                                            <option></option>
                                            {driverPropsUI}
                                        </select>
                                    </div>
                                    <div style={{display: "flex", justifyContent: "space-around"}}>
                                        <label className="control-label mb-10">Device Props</label>
                                        <select className="form-control" onChange={this.devicePropToBind.bind(this)}>
                                            <option></option>
                                            {devicePropsUI}
                                        </select>
                                        <label className="control-label mb-10">Instance Bound</label>
                                        <select className="form-control" onChange={this.instanceToBind.bind(this)}>
                                            <option></option>
                                            {instanceUI}
                                        </select>
                                    </div>
                                    <div style={{display: "flex", justifyContent: "space-around"}}>
                                        <button className="btn btn-primary" onClick={this.bindPreview.bind(this)}>Bind Preview</button>
                                        <button className="btn btn-success" onClick={this.bind.bind(this)}>Bind</button>
                                    </div>
                                </div>

                                <div>
                                    <textarea className="form-control" value={JSON.stringify(this.state.bindPreview)}/>
                                </div>
                    </div>
                    </div>
                    <div className="modal-footer">
                </div>
            </div>
        </div>
        )
    }

}
