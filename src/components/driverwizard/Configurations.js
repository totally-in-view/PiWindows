import React from "react";
import Panel from "../Panel";
import {Redirect} from "react-router-dom";
import Accordion from "../Accordion"
import Functions from "./Functions"
export default function Configurations(props){
    var view;
    var options = [];

    if(props.driver === {}){

    }
    var configs = [];

    if(props.functionCreatorOpened === true){
        let funct = null
        props.required.functions.forEach((func)=>{
            if(func.name === props.functionOpened){
                funct = func;
            }
        });

        view = <Functions properties={props.required.props} function={funct} save={props.save} close={props.closeFunctionCreator} />
    }
    props.required.functions.forEach((func)=>{
        configs.push({
            name: func.name,
            body: <div key={func.name} className="configuration">
            <div>
            <div className="checkbox">
                <input name={func.name} type="checkbox" disabled checked/>
                <label htmlFor={func.name} className="control-lavel mb-10 text-left">
                {func.name}
                </label>
            </div> 
            
            <div className={`set-action-${func.name}`}>
                <textarea name={`action-${func.name}`} placeHolder="Action Display"rows={5} value={func.body} disabled/>
            </div>
            </div>
            <div>
            <div className="form-group">
                <label className="control-label mb-10 text-left">
                    Function
                </label>

                <button className="btn btn-primary btn-block" name ={func.name} onClick={props.openFunctionCreator}>Edit Fuction</button>
            </div>
            </div>
        </div>,
        active: false
        
        })
    })
    
    return (
        <div>
        {view}
        <Panel header={"New Driver"} body={
            <form onSubmit={props.submit} id="configurations-form" action="#" role="application" clas="wizard clearfix" novalidate="novalidate">
                <div className="steps clearfix">
                <ul role="tablist" className="tablist">
                    <li role="tab" className="disabled" aria-disabled="false" aria-selected="true">
                        <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                            <span className="head-font capitalize-font">Driver Info</span>
                        </a>
                    </li>
                    <li role="tab" className="active" aria-disabled="false" aria-selected="true">
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
                    <div className="col-sm-12">
                    <div className="form-wrap">
                        <Accordion info={configs}/>
                    </div>
                    </div>
                </div>
            </fieldset>
              <div className="actions clearfix">
                    <ul role="menu" aria-label="Pagination">
                        <li aria-disabled="true"                    >
                            <input type="submit" onClick={props.prev} value="Previous"/>
                        </li>
                        <li
                        aria-hidden="false"
                        aria-disabled="false"
                        className
                        style={{ display: "inline-block" }}
                        >
                            <input type="submit" value="Next"/>
                        </li>
                    </ul>
                </div>

                </div>
            </form>
            }/> 
    </div>
    )
}

Configurations.defaultProps = {
    configurations: [
        {
            type: "Load",
            configs: [
                "dimmable",
                "rgb",
                "rgba",
                "rgbw",
                "saturation"
            ]
        },
        {
            type: "HVAC",
            configs: [
                "adjustCombinedSetpoint",
                "adjustDeadband",
            ]
        },
        {
            type: "Shades",
            configs: [
                "reversePercentages",
            ]
        },
        {
            type: "AV",
            configs: [
                "volumeControl",
                "channelControl",
                "playPause",
                "fastForward",
                "rewind",
                "songDuration",
                "coverArt",
                "record",
            ]
        }
    ],

    keywords: [
        "if",
        "else",
    ],
    equality: [
        "===",
        ">=",
        "<=",
        "+=",
        "-="
    ]
}