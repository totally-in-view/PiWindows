import React from "react";
import Panel from "../Panel";

export default function Info(props){
    var parentDriverOptions = [];
    if(props.parentDrivers.length > 0){
        props.parentDrivers.forEach((driver)=>{
            parentDriverOptions.push(<option>{driver.props.type}</option>)
        })
    }
    return (
        <Panel header="New Driver" body={<form onSubmit={props.submit} id="info-form" action="#" role="application" clas="wizard clearfix" novalidate="novalidate">
        <div className="steps clearfix">
        <ul role="tablist" className="tablist">
            <li role="tab" className="active" aria-disabled="false" aria-selected="true">
                    <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                        <span className="head-font capitalize-font">Driver Info</span>
                    </a>
                </li>
                <li role="tab" className="disabled" aria-disabled="false" aria-selected="true">
                    <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                        <span className="head-font capitalize-font">Configurations</span>
                    </a>
                </li>
                <li role="tab" className="disabled" aria-disabled="false" aria-selected="true">
                    <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                        <span className="head-font capitalize-font">Review</span>
                    </a>
                </li>
      </ul>

      <fieldset id="example-advanced-form-p-0" role="tabpanel" aria-labelledby="example-advanced-form-h-0" className="body current" aria-hidden="false">
        <div className="row">
            <div className="col-sm-6">
            <div className="form-wrap" style={{color: "#fff"}}>
            <div className="form-group">
                    <label className="control-label mb-10 text-left">Driver ID</label>
                    <input className="form-control" name="Driver ID" required/>

                    <label className="control-label mb-10 text-left">Parent Driver</label>
                    <select className="form-control" name="Parent Driver" required>
                        <option></option>
                       {parentDriverOptions}
                    </select>
                    <label className="control-label mb-10 text-left">Web Service</label>
                    <select className="form-control" name="Web Service" required>
                        <option></option>
                        <option>Telnet</option>
                        <option>REST</option>
                        <option>SOAP</option>
                    </select>
                    
                    <label className="control-label mb-10 text-left">Description</label>
                    <textarea className="form-control" name="Description" rows={5}/>

                    <label className = "control-label mb-10 text-left">Widget</label>
                    <select className="form-control" name="Widget" required>
                        <option></option>
                        <option>LightingWidget</option>
                        <option>ColorLightingWidget</option>
                        <option>HVACWidget</option>
                        <option>ShadeWidget</option>
                    </select>
            </div>
            </div>
            </div>
            <div className="col-sm-6">
            <div className="form-wrap" style={{color: "#fff"}}>
            <div className="form-group">
                    
            </div>
            </div>
            </div>
        </div>
    </fieldset>
      <div className="actions clearfix">
            <ul role="menu" aria-label="Pagination">
                <li className="disabled" aria-disabled="true">
                <input type="submit" role="menuitem" value=" Previous"/>
                </li>
                <li
                aria-hidden="false"
                aria-disabled="false"
                className
                style={{ display: "inline-block" }}     
                >
                    <input type="submit" role="menuitem" value=" Next"/>
                       
                    
                </li>
            </ul>
        </div>

        </div>
    </form>
        }   /> 
)

}