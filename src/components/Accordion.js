import React from "react";

export default class Accordion extends React.Component {
    constructor(props){
        super(props)
        this.state = {
          info: this.props.info
        }
      }
    toggleTab(tab){
      var newTab = tab;
      if(tab.active === true){
        newTab.active = false;
      }
      else{
        newTab.active = true
      }
      var tabs = this.state.info;

      tabs[tabs.indexOf(tab)] = newTab;
      this.setState((prevState, props)=>({
        info: tabs
      }));
    }
    render(){
      var accordion = []
      this.state.info.forEach((tab)=>{
        if(tab.active === false){
        accordion.push(
          <div className="panel panel-default">
          <div className="panel-heading" role="tab" id="heading_1" onClick ={this.toggleTab.bind(this, tab)}>
            <a role="button" data-toggle="collapse" data-parent="#accordion_1" href="#collapse_1" aria-expanded="false" className="collapsed">{tab.name}</a> 
          </div>
          <div id="collapse_1" className="panel-collapse collapse" role="tabpanel" aria-expanded="false" style={{height: 0}}>
            <div className="panel-body pa-15">{tab.body}</div>
          </div>
        </div>
        )
      }
      else{
        accordion.push(
          <div className="panel panel-default">
          <div className="panel-heading activestate" role="tab" id="heading_1" onClick={this.toggleTab.bind(this, tab)}>
            <a role="button" data-toggle="collapse" data-parent="#accordion_1" href="#collapse_1" aria-expanded="true" className>{tab.name}</a> 
          </div>
          <div id="collapse_1" className="panel-collapse collapse in" role="tabpanel" aria-expanded="true">
            <div className="panel-body pa-15">{tab.body}</div>
          </div>
        </div>
        )
      }
      })
        return (
          <div className="panel-group accordion-struct" id="accordion_1" role="tablist" aria-multiselectable="true">
            {accordion}
          </div>

          
        )
    }
}