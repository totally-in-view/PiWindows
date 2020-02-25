import React from "react";

export class ClientAccordion extends React.Component {
    constructor(props){
        super(props)
        this.state = {
          info: this.props.info
        }
      }
    toggleTab(tab, event){

      if(event.target.tagName !== "A"){
        return;
      }
      var newTab = tab;
      var tabs = this.state.info;

      if(tab.active === true){
        newTab.active = false;
      }
      else{
        newTab.active = true
        this.props.toTab(newTab.accordionUUID, tabs.indexOf(tab));
      }
     
      tabs[tabs.indexOf(tab)] = newTab;
      this.setState((prevState, props)=>({
        info: tabs
      }));
    }
    editName(uuid,pos,event){
      if(event.key === "Enter"){
        event.preventDefault();
        this.props.changeTabName(uuid, pos, event.target.textContent);
        
      }
    }

    render(){
      var accordion = []
      for(var i = 0; i < this.state.info.length; i++){
        var tab = this.state.info[i];
        if(tab.active === false){
        accordion.push(
          <div className="panel panel-default">
          <div className="panel-heading" role="tab" id="heading_1" onClick ={this.toggleTab.bind(this, tab)}>
            <a role="button" data-toggle="collapse" data-parent="#accordion_1" href="#collapse_1" aria-expanded="false" className="collapsed"><div>{tab.widgetsLeft}</div><div onKeyPress={this.editName.bind(this, tab.parentId, i)} contentEditable>{tab.name}</div><div>{tab.widgetsRight}</div></a> 
          </div>
          <div id="collapse_1" className="panel-collapse collapse" role="tabpanel" aria-expanded="false" style={{height: 0}}>
            <div className="panel-body pa-15">{tab.body}</div>
          </div>
        </div>
        )
      }
      else{
        var tabBodyUI = [];
        accordion.push(
          <div className="panel panel-default">
          <div className="panel-heading activestate" role="tab" id="heading_1" onClick={this.toggleTab.bind(this, tab)}>
            <a role="button" data-toggle="collapse" data-parent="#accordion_1" href="#collapse_1" aria-expanded="true" className="collapsed"> <div>{tab.widgetsLeft}</div><div onKeyPress={this.editName.bind(this, tab.parentId, i)} contentEditable>{tab.name}</div><div>{tab.widgetsRight}</div></a> 
          </div>
          <div id="collapse_1" className="panel-collapse collapse in" role="tabpanel" aria-expanded="true">
            <div className="panel-body pa-15">{tabBodyUI}</div>
          </div>
        </div>
        )
      }
      }
        return (
          <div className="panel-group accordion-struct" id="accordion_1" role="tablist" aria-multiselectable="true">
            {accordion}
          </div>

          
        )
    }
}

ClientAccordion.defaultProps = {
  changeTabName: ()=>{},
  changeBody: ()=>{},
  toTab: ()=>{}
}