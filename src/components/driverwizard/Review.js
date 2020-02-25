import React from "react";
import Panel from "../Panel";
import Slider from "../Slider";

export default function Review(props){
    let configurations = [];
    var actions = props.driver.actions;

    actions.forEach((action)=>{
        var widget = "";

        switch(action.widget){
            case "Slider":
                widget = <Slider />
                break;
            default:
                break;
        }

        configurations.push(<div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group review-input">
                                            <label className="control-label col-md-3">Name:</label>
                                            <div className="col-md-9">
                                                <p className="form-control-static">{action.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group review-input" style={{display: "flex", flexFlow: "column wrap", alignItems: "flex-start"}}>
                                            <label className="control-label col-md-3">Action:</label>
                                            <div className="col-md-9">
                                                <p className="form-control-static">{action.body}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group review-input">
                                        <label className="control-label col-md-3">Widget:</label>
                                        <div className="col-md-9">
                                            <p className="form-control-static">{action.widget}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )
    })
    return (
        <Panel header={"New Driver"} body={
            <form id="review-form" action="#" role="application" clas="wizard clearfix" novalidate="novalidate" onSubmit={props.submit}>
                <div className="steps clearfix">
                <ul role="tablist" className="tablist">
                <li role="tab" className="disabled" aria-disabled="false" aria-selected="true">
                        <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                            <span className="head-font capitalize-font">Driver Info</span>
                        </a>
                    </li>
                    <li role="tab" className="disabled" aria-disabled="false" aria-selected="true">
                        <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                            <span className="head-font capitalize-font">Configurations</span>
                        </a>
                    </li>
                    <li role="tab" className="active" aria-disabled="false" aria-selected="true">
                        <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                            <span className="head-font capitalize-font">Review</span>
                        </a>
                    </li>
              </ul>

              <fieldset id="example-advanced-form-p-0" role="tabpanel" aria-labelledby="example-advanced-form-h-0" className="body current" aria-hidden="false">
                <div className="row">
                    <div className="col-sm-6">
                    <div className="form-wrap" style={{color: "#fff"}}>
                    <div className="form-body">
                        <h6 className="txt-dark capitalize-font">Driver Info</h6>
                        <hr className="light-grey-hr" />
                        <div className="row">
                            <div className="col-md-6">
                            <div className="form-group review-input">
                                <label className="control-label col-md-5">Driver ID:</label>
                                <div className="col-md-7">
                                <p className="form-control-static"> {props.driver.id} </p>
                                </div>
                            </div>
                            </div>
                            <div className="col-md-6">
                            <div className="form-group review-input">
                                <label className="control-label col-md-7">Parent Driver:</label>
                                <div className="col-md-5">
                                <p className="form-control-static"> {props.driver.parent}</p>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                            <div className="form-group review-input">
                                <label className="control-label col-md-5">Web Service:</label>
                                <div className="col-md-7">
                                <p className="form-control-static"> {props.driver.webService}</p>
                                </div>
                            </div>
                            </div>
                            <div className="col-md-6">
                            <div className="form-group review-input">
                                <label className="control-label col-md-5">Description:</label>
                                <div className="col-md-7">
                                <p className="form-control-static" contentEditable> {props.driver.description}</p>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="seprator-block" />
                        <h6 className="txt-dark capitalize-font">Configurations</h6>
                        <hr className="light-grey-hr" />
                       
                        
                        
                        {configurations}
                        </div>

                    </div>
                    </div>
                </div>
            </fieldset>
              <div className="actions clearfix">
                    <ul role="menu" aria-label="Pagination">
                        <li onClick={props.prev} className="" aria-disabled="true">
                            <input type = "submit" value = "Previous"/>
                        </li>
                        <li aria-hidden="true" style={{ display: "inline-block" }}>
                            <input type = "submit" value = "Finish"/>
                        </li>
                    </ul>
                </div>

                </div>
            </form>
            }/> 
    )
}

Review.defaultProps = {
    driver: {
        description: "",
        parent: "",
        id:"",
        webService: ""
    }
}