import React from "react";
import FunctionSwitch from "./FunctionSwitch";

export default class Functions extends React.Component {
    constructor(props){
      super(props);
      var preview;
      if(this.props.function.body === null){
        preview = "";
      }
      else{
        preview = this.props.function.body
      }
     
     this.state = {
        params: [],
        statements: new Map(),
        indent: 0,
        advanceModeDisabled: true,
        previewBody: preview,
        method: ""
        }
    }

    addParams(event){
        event.preventDefault();
        if(event.key === "Enter"){
            var params = this.state.params;
            params.push(event.target.value)
            this.setState((prevState, props)=>({
                params: params
            }))
        }
    }

    addConditional(paramOptions, nested = null){
        var uuid = Math.floor(Math.random() * 1000000)
        var line = {
            uuid: uuid,
            ui: "conditional",
            values: new Map(),
            toggle: ""
        }

        line.values.set("conditional", "");
        line.values.set("variable", "");
        line.values.set("equality", "");
        line.values.set("qualifier", "");
      
      var statements = this.state.statements;
      statements.set(uuid, line);
      this.setState((prevState, props) =>({
          statements: statements,
          indent: prevState.indent+20,

      }))
    }

    getConditional(uuid, paramOptions){
      var statement = this.state.statements.get(uuid);
      var toggled = statement.toggle;
      var inputReturned = "";
      if(toggled === "variable"){
        inputReturned = <select className="form-control" name ="returned" onChange={this.handleChange.bind(this, uuid)}>
                  <option></option>
                  {paramOptions}
                </select>
      }
      else{
        inputReturned =  <input type="text" name="returned" className="form-control not-selected" onChange={this.handleChange.bind(this, uuid)}/>
      }
      return(
        <div style={{marginLeft: `${this.state.indent}px`}}>
        <div className="form-group mt-30 mb-30">
          <select name="conditional" className="form-control" onChange={this.handleChange.bind(this, uuid)}>
            <option></option>
            <option>if</option>
            <option>else</option>
          </select>
        </div>
        <div className="form-group mt-30 mb-30">
          <select className="form-control" name="variable" onChange={this.handleChange.bind(this, uuid)}>
            <option></option>
            {paramOptions}
          </select>
        </div>
        <div className="form-group mt-30 mb-30">
          <select className="form-control" name="equality" onChange={this.handleChange.bind(this, uuid)}>
            <option></option>
            <option>===</option>
            <option>>=</option>
            <option>{"<="}</option>
          </select>
        </div>

        <div className="form-group mt-30 mb-30">
          <div onChange={this.toggleInput.bind(this, uuid)}>
              <label for="variable" style={{marginRight: "10px"}}>Variable</label>
              <input type="radio" name = {"assign-"+uuid} id={`variable`} style={{marginRight: "10px"}}/>
              <label for="variable" style={{marginRight: "10px"}}>Text</label>
              <input type="radio" name = {"assign-"+uuid} id={`text`} />
              {inputReturned}
          </div>
        </div>
      </div>
      )
    }
    closeConditional(event){
      event.preventDefault();
      var previewBody = this.state.previewBody +="\n"
 
      this.state.statements.forEach((val, key, map)=>{
        if(val.ui === "conditional"){
          val.values.forEach((word, key, map)=>{
            if(word === "if"){
              previewBody += `${word}(` 
            }
            else if(word === "else"){
              previewBody = `${word} if(`
            }
            else{
              previewBody += ` ${word} `
            }
          });
          previewBody += "){\n"
        }
        else if(val.ui === "return"){
          val.values.forEach((word, key, map)=>{
            previewBody += `\treturn ${word};\n`
          })
        }
        else {
          previewBody += "\t";
          val.values.forEach((word, key, map)=>{
            previewBody += `${word}`
          });
          previewBody += ";\n";
        }
      });

      previewBody += "}"
      this.setState({
        previewBody: previewBody,
        statements: new Map()
      })
    }

    toPreview(event){
      event.preventDefault();
      var previewBody = this.state.previewBody;
      previewBody += "\n";
      this.state.statements.forEach((val, key, map)=>{
        if(val.ui === "conditional"){
          val.values.forEach((word, key, map)=>{
            if(word === "if"){
              previewBody += `${word}(` 
            }
            else if(word === "else"){
              previewBody = `${word} if(`
            }
            else{
              previewBody += ` ${word} `
            }
          });
          previewBody += "){\n"
        }
        else if(val.ui === "return"){
          val.values.forEach((word, key, map)=>{
            previewBody += `return ${word};\n`
          })
        }
        else {
          val.values.forEach((word, key, map)=>{
            previewBody += `${word}`
          });
          previewBody += ";\n";
        }
      });

      previewBody += ""
      this.setState({
        previewBody: previewBody,
        statements: new Map()
      });
    }

    getUIForStatement(uuid, paramOptions){
      var statement = this.state.statements.get(uuid);
      var toggled = statement.toggle;
      var inputReturned = "";
      if(toggled === "variable"){
        inputReturned = <select className="form-control" name ="returned" onChange={this.handleChange.bind(this, uuid)}>
                  <option></option>
                  {paramOptions}
                </select>
      }
      else{
        inputReturned =  <input type="text" name="returned" className="form-control not-selected" onChange={this.handleChange.bind(this, uuid)}/>
      }
        return (
            <div style={{marginLeft: `${this.state.indent}px`}}>
            <div className="form-group mt-30 mb-30">
            <select className="form-control" name="variable" onChange={this.handleChange.bind(this, uuid)}>
              <option></option>
              {paramOptions}
            </select>
          </div>
          <div className="form-group mt-30 mb-30">
            <select className="form-control" name="equality" onChange={this.handleChange.bind(this, uuid)}> 
              <option></option>
              <option>=</option>
              <option>+=</option>
              <option>{"-="}</option>
              <option>{"*="}</option>
              <option>{"/="}</option>
            </select>
          </div>
    
          <div className="form-group mt-30 mb-30">
            
            <div onChange={this.toggleInput.bind(this, uuid)}>
                <label for="variable" style={{marginRight: "10px"}}>Variable</label>
                <input type="radio" name = {`assign-${uuid}`} id="variable" style={{marginRight: "10px"}}/>
                <label for="variable" style={{marginRight: "10px"}}>Text</label>
                <input type="radio" name = {`assign-${uuid}`} id="text" />
                
            </div>
            {inputReturned}
          </div>
          </div>
        )
    }

    addAssignment(paramOptions, nested = null){
      var uuid = Math.floor(Math.random() * 1000000)
      var line = {
          uuid: uuid,
          ui: "assignment",
          values: new Map(),
          toggle: ""
      }

    line.values.set("variable", "");
    line.values.set("equality", "");
    line.values.set("value", "");
    var statements = this.state.statements;
    statements.set(uuid,line)
    this.setState((prevState, props)=>({
        statements: statements,
    }))

    }
    getUIForReturn(uuid, paramOptions){
      var statement = this.state.statements.get(uuid);
      var toggled = statement.toggle;
      var inputReturned = "";
      if(toggled === "variable"){
        inputReturned = <select className="form-control" name ="returned" onChange={this.handleChange.bind(this, uuid)}>
                  <option></option>
                  {paramOptions}
                </select>
      }
      else{
        inputReturned =  <input type="text" name="returned" className="form-control not-selected" onChange={this.handleChange.bind(this, uuid)}/>
      }
      return(
        <div style={{marginLeft: `${this.state.indent}px`}}>
        <div className="form-group mt-30 mb-30">
        <select className="form-control" name="return">
          <option>return</option>
        </select>
      </div>
      <div className="form-group mt-30 mb-30">
        <div onChange={this.toggleInput.bind(this, uuid)}>
            <label for="variable" style={{marginRight: "10px"}}>Variable</label>
            <input type="radio" name = {`assign-${uuid}`} id="variable" style={{marginRight: "10px"}}/>
            <label for="variable" style={{marginRight: "10px"}}>Text</label>
            <input type="radio" name = {`assign-${uuid}`} id="text"/>
            {inputReturned}
        </div>
      </div>
      </div>
      )
    }
    addReturn(paramOptions, nested = null){
        var uuid = Math.floor(Math.random() * 1000000)
        var line = {
            ui: "return",
            values: new Map(),
            indent: this.state.indent,
            toggle: ""
        }

        line.values.set("returned", "");
    var statements = this.state.statements;
    statements.set(uuid,line)
    
    this.setState((prevState, props)=>({
        statements: statements
    }))

    }

    toggleInput(uuid, event){
      var statement = this.state.statements.get(uuid);
      statement.toggle = event.target.id
      var statements = this.state.statements;
      statements.set(uuid, statement);
      this.setState({
        statements: statements
      })
    }
    handleChange(uuid, event){
      var statement = this.state.statements.get(uuid);

      statement.values.set(event.target.name, event.target.value);
      var statements = this.state.statements;

      statements.set(uuid, statement);
      this.setState({
        statements: statements
      });
    }

    toggleAdvanceMode(){
      this.setState((prevState, props)=>({
        advanceModeDisabled: !prevState.advanceModeDisabled 
      }))
    }

    editBody(event){
      if(event.keycode === 9){
        event.preventDefault(); 
        this.setState((prevState, props)=>({
          previewBody: `${prevState.previewBody}\t`
        }))
      }else{
        this.setState({
          previewBody: event.target.value
        })
      }
    }

    addMethod(event){
      this.setState({
        method: event.target.value
      })
    }

    addWidget(event){
      this.setState({
        widget: event.target.value
      })
    }
    saveFunction(){
      var newFunction = {
        name: this.props.function.name,
        params: this.state.params,
        body: this.state.previewBody,
        method: this.state.method
      }
      this.props.save(newFunction);
    }
    render(){

        var paramLabels = [];
        var paramOptions = [];
        
        for(var prop in this.props.properties){
          paramOptions.push(<option>{`this.props.${prop}`}</option>)
        }
        this.state.params.forEach((param)=>{
            paramLabels.push(<span className="tab label label-info">{param}</span>);
            paramOptions.push(<option>{param}</option>)
        })

        if(this.props.function.params !== null){
          this.props.function.params.forEach((param)=>{
            paramLabels.push(<span className="tab label label-info">{param}</span>);
            paramOptions.push(<option>{param}</option>)
          })
        }
        var statements = [];
        this.state.statements.forEach((val, key, map)=>{
          switch(val.ui){
            case "assignment":
              statements.push(this.getUIForStatement(key, paramOptions));
              break;
            case "conditional":
              statements.push(this.getConditional(key, paramOptions));
              break;
            case "return": 
              statements.push(this.getUIForReturn(key, paramOptions));
              break;
            default:
              break;
          }  
        });
        return(
            <div className="modal fade bs-example-modal-lg in" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true" style={{display: "block"}}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" data-dismiss="modal" aria-hidden="true" onClick={this.props.close}>×</button>
                        <h5 className="modal-title" id="myLargeModalLabel">Function Creator</h5>
                    </div>
                    <div className="modal-body">
                        <h3 className="mb-15">{this.props.function.name}</h3>
                            <div className="function-form mb-40">
                            <div className="tags-default">
                            <label className="control-label mb-10">Parameters</label>
                                <div className="bootstrap-tagsinput">
                                    <div className="labels">{paramLabels}</div>
                                    <input type="text" placeHolder="Add Parameter" onKeyUp={this.addParams.bind(this)}/>
                                </div>
                                <input type="text" dataRole="tagsinput" placeHolder="Add Parameter" style={{display: "none"}}/>

                                <label className="control-label mb-10">Method</label>
                                <select className="function-method" onChange={this.addMethod.bind(this)}>
                                  <option></option>
                                  <option>GET</option>
                                  <option>POST</option>
                                  <option>PUT</option>
                                  <option>DELETE</option>
                                </select>

                                <label className="control-label mb-10">Widget</label>
                                <select className="function-method" onChange={this.addWidget.bind(this)}>
                                  <option></option>
                                  <option>Button</option>
                                  <option>ColorWheel</option>
                                  <option>CoolSetText</option>
                                  <option>HeatSetText</option>
                                  <option>SceneButton</option>
                                  <option>Slider</option>
                                  <option>Shade</option>
                                </select>
                            </div>

                            <div className="conditionals">
                            <div className="conditional-header" style={{display: 'flex', flexFlow: 'column wrap', justifyContent: 'space-between'}}>
                              <div style={{display: "flex", flexFlow: "row wrap", justifyContent: "space-around", margin: "10px"}}>
                                <button onClick={this.addConditional.bind(this, paramOptions)} className="btn btn-rounded btn-info btn-sm">Open Conditional</button> 
                                <button onClick={this.closeConditional.bind(this)} type="submit"  className="btn btn-rounded btn-danger btn-sm">Close Conditional</button> 
                              </div>
                              <div style={{display: "flex", flexFlow: "row wrap", justifyContent: "space-between", margin: "10px" }}>
                                <button onClick={this.addAssignment.bind(this, paramOptions)} className="btn btn-rounded btn-primary btn-sm">Assign Variable</button> 
                                <button onClick={this.addReturn.bind(this, paramOptions)} className="btn btn-rounded btn-warning btn-sm">Add Return</button>
                                <button onClick={this.toggleAdvanceMode.bind(this)} className="btn btn-default btn-rounded btn-sm">Advance Mode</button>
                              </div>
                            </div>
                            <div className="conditional-body">

                            {statements}
                            <div style={{margin: "10px", display:"flex", justifyContent: "space-around"}}>
                                <button  onClick={this.toPreview.bind(this)} type="button" className="btn btn-primary text-left" data-dismiss="modal">Preview</button>
                                <button onClick={this.saveFunction.bind(this)} type="button" className="btn btn-danger text-left" data-dismiss="modal">Save</button>
                            </div>
                           </div>
                          </div>
                            </div>
                    </div>
                    <div className="modal-footer">
                    <textarea className="mt-10" rows={5} style={{color: "#000"}}  value={this.state.previewBody} onKeyDown={this.editBody.bind(this)} disabled={this.state.advanceModeDisabled}/>
                        
                    </div>
                </div>
            </div>
        </div>
        )
    }
}

Functions.defaultProps = {
  
}