import React from "react";


export default class Wizard extends React.Component{
    constructor(props){
        super(props)
    }

    render(){
        var tabs = [];
        var nextBtn = <li
        aria-hidden="false"
        aria-disabled="false"
        className
        style={{ display: "inline-block" }}
        >
            <input type="submit" value="Next"/>
        </li>

        var width = 100/this.props.steps.length
        console.log(width);
        this.props.steps.forEach((step)=>{
            tabs.push(<li role="tab" className={step.active} style={{width: `${width}%`}} aria-disabled="false" aria-selected="true">
            <a id="example-advanced-form-t-0" href="#example-advanced-form-h-0" aria-controls="example-advanced-form-p-0">
                <span className="head-font capitalize-font">{step.name}</span>
            </a>
        </li>)
            if(step.name == this.props.steps[this.props.steps.length-1].name && step.active == "active"){
                nextBtn =<li
                aria-hidden="false"
                aria-disabled="false"
                className
                style={{ display: "inline-block" }}
                >
                    <input type="submit" value="Finish"/>
                </li>
            }
        })
        return(
        <form id="configurations-form" onSubmit={this.props.submit}action="#" role="application" clas="wizard clearfix" novalidate="novalidate">
        <div className="steps clearfix">
        <ul role="tablist" className="tablist">
            {tabs}
      </ul>

      <fieldset id="example-advanced-form-p-0" role="tabpanel" aria-labelledby="example-advanced-form-h-0" className="body current" aria-hidden="false">
        <div className="row">
            <div className="col-sm-12">
            <div className="form-wrap">
                {this.props.body}
            </div>
            </div>
        </div>
    </fieldset>
      <div className="actions clearfix">
            <ul role="menu" aria-label="Pagination">
                <li aria-disabled="true">
                    <input type="submit" value="Previous"/>
                </li>
                {nextBtn}
            </ul>
        </div>

        </div>
        </form>
        )
    }
}
