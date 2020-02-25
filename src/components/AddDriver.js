import React from "react";
import Panel from "./Panel";
import Form from "./Form";
import Info from "./driverwizard/Info";
import Configurations from "./driverwizard/Configurations";
import Review from "./driverwizard/Review";

//React Router
import {Redirect, Route, withRouter} from "react-router-dom"

export default class AddDriver extends React.Component {
    constructor(props){
        super(props);
        var config = new Map();
        config.set("Load", new Map());
        var opts = new Map();
        this.stepNo = this.props.stepNo;
        this.props.fields.forEach((field)=>{
            if(field.type === "select"){
                opts.set(field.label, {
                    options: field.options,
                    currentvalue: field.options[0]
                })
            }
        });

        this.state = {
            step: 1,
            steps: [<Redirect to="/add-driver/info" />, <Redirect to="/add-driver/configurations"/>, <Redirect to="/add-driver/review" />],
            driver: {actions: []},
            functionCreatorOpen: false,
            functionOpened: ""
        }
    }

    componentWillReceiveProps(nextProps){
    }
    componentDidMount(){
      this.props.socket.emit("ui-drivers-request");
      this.props.socket.on("ui-drivers-response", (drivers)=>{
      });
    }
    generateFormUI(fields){
        var forminputs = [];
        fields.forEach((field)=>{
            
                        if(field.type === "select"){
                            var options = field.options
                            var optsUI = [];
                            options.forEach((opt)=>{
                                optsUI.push(<option value={opt}>{opt}</option>);
                            })
            
                            forminputs.push(
                                <div className="form-group">
                                    <label className="control-label mb-10 text-left">{field.label}</label>
                                    <select className="form-control" name={field.label} onChange={this.handleSelectChange.bind(this, field.label)} required>
                                        {optsUI}
                                    </select>
                                </div>
                            )
                        }
                        else if(field.type === "textarea"){
                            forminputs.push(
                                <div className="form-group">
                                    <label className="control-label mb-10 text-left">{field.label}</label>
                                    <textarea name={field.label} className="form-control" rows={5} />
                                </div>
                            );
                        }
                        else if(field.type === "text"){
                            forminputs.push(
                                <div className="form-group">
                                <label className="control-label mb-10 text-left">{field.label}</label>
                                <input type={field.type} name={field.label} className="form-control" defaultValue="" required/>
                            </div>
                            )
                        }
                    })
        
                    return forminputs
    }

    getConfigurations(configs, parentDriver){
        var configUI = [];
        configs.get(parentDriver).forEach((value, key)=>{
                    configUI.push(<div style={{background: "#FFF", height: "500px"}}>
                        <div className="checkbox">
                            <input name={key} type="checkbox" checked={value} onChange={this.handleCheckboxChange.bind(this, key)}/>
                            <label htmlFor={key} className="control-lavel mb-10 text-left">
                            {key}
                            </label>
                        </div> 
                        <div className={`set-action-${value}`}>
                            <textarea name={`action-${key}`} placeHolder="Write action here..."rows={5}/>
                        </div>
                    </div>)
                });
            return configUI;
    }

    formCallBack(info){
            if(this.state.config.has(info)){
            this.setState((prevState,prop)=>({
                currentconfig: prevState.config.get(info)
            }));
        }
    }
    async handleSubmit(event){
        event.preventDefault();
        var driver = this.state.driver;

        if(event.target.id === "info-form"){
            for(var i = 0; i < event.target.length-1; i++){
                var input = event.target[i];
                if(input.name === "Driver ID"){
                    driver["id"] = input.value;
                }    
                if(input.name === "Parent Driver"){
                    this.props.drivers.forEach((parentDriver)=>{
                        if(parentDriver.props.type === input.value){
                            driver["parent"] = parentDriver.props.type;       
                        }
                    }) 
                }

                if(input.name === "Description"){
                    driver["description"] = input.value;
                }

                if(input.name === "Web Service"){
                    driver["webService"] = input.value;
                }

                if(input.name === "Widget"){
                    driver["widget"] = input.value;
                }
            }
            driver["actions"] = [];
            console.log(driver);
            
            this.setState({
                driver: driver,
                step: 2
            })
        }

        if(event.target.id === "configurations-form"){
            this.setState({
                step: 3
            })
        }
    }
    handleSelectChange(key, event){
        var parent = ""
        if(event.target.name === "Parent Driver"){
            parent = event.target.value;
            this.setState((prevState, props)=>({
                parentDriver: parent,
                configUI: this.getConfigurations(prevState.config, parent)
            }))
        }
    }

    handleCheckboxChange(key, event){
        var configs = this.state.configs;

        configs.set(key, !configs.get(key))
        this.setState((prevState, props)=>({
            configs: configs
        }));
        
    }

    submitNewClass(obj){
        this.props.socket.emit("gen-new-class", {obj: obj});
    }

    previousStep(event){
        event.preventDefault();
    }

    nextStep(event){
        event.preventDefault();

        if(this.state.step >= 3){
            this.setState((prevState, props)=>({
                step: prevState.step +1
            }))
        }
    }

    openFunctionCreator(event){
        event.preventDefault();
        this.setState({
            functionCreatorOpen: true,
            functionOpened: event.target.name
        });
    }

    closeFunctionCreator(event){
        event.preventDefault();

        this.setState({
            functionCreatorOpen: false
        })
    }

    saveFunction(funct){
        let driver = this.state.driver;
        driver.actions.push(funct);
        this.setState({
            driver: driver,
            functionCreatorOpen: false,
            functionOpened: ""
        });
    }
    render(){
        var view = this.state.steps[this.state.step-1]
        
        return(
            
           <div>
               {view}
            <Route exact path="/add-driver/info/" render={(props)=>{ return(
                <Info parentDrivers = {this.props.drivers} next ={this.nextStep.bind(this)} prev ={this.previousStep.bind(this)} submit={this.handleSubmit.bind(this)}/>
            )}} />

            <Route exact path="/add-driver/configurations" render={(props)=>{ 
                var configurationInformation = null;
                this.props.drivers.forEach((driver)=>{
                    if(driver.props.type === this.state.driver.parent){
                        configurationInformation = driver
                    }
                })
                
                return(
                    <Configurations submit = {this.handleSubmit.bind(this)} functionCreatorOpened={this.state.functionCreatorOpen} functionOpened={this.state.functionOpened} driver={this.state.driver} openFunctionCreator = {this.openFunctionCreator.bind(this)} closeFunctionCreator = {this.closeFunctionCreator.bind(this)}   required={configurationInformation} prev = {this.previousStep.bind(this)} save={this.saveFunction.bind(this)}/>
            )}} />
             
            <Route exact path="/add-driver/review" render={(props)=>{ return(

               <Review driver={this.state.driver} submit = {this.handleSubmit.bind(this)} next ={this.nextStep.bind(this)} prev ={this.previousStep.bind(this)}/>
            )}} />

            </div> 
        );
    }

}


AddDriver.defaultProps = {
    fields: [
        {
            label: "Driver ID",
            type: "text",
            currentvalue: ""
        },
        {
            label: "Parent Driver",
            type: "select",
            options: [
                "Load",
                "HVAC",
                "Shades"
            ],
            currentvalue: "",
        },
        {
            label: "Network Service",
            type: "select",
            options: [
                "Telnet",
                "REST",
                "SOAP"
            ],
            currentvalue: ""
        },
        {
            label: "Description",
            type: "textarea"
        }
    ],

    parentDrivers: [
        {
            name: "Load",
            props: [
                "id",
                "level"
            ],

            requiredFunctions: [ "toggle" ]
        },
        {
            name: "HVAC",
            props: [
                "id",
                "space",
                "coolset",
                "heatset"
            ],

            requiredFunctions: [ "adjust-heat", "adjust-cool", "adjust-space" ]
        },
        {
            name: "Shades",
            props: [
                "id",
                "level"
            ],

            requiredFunctions: [ "toPosition" ]
        },
        {
            name: "AV",
            props: [
                "id",
            ],

            requiredFunctions: []
        }

    ],

   
    stepNo: 1
        
}