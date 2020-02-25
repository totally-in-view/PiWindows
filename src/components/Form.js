import React from "react";

export default class Form extends React.Component{
    constructor(props){
        super(props);

        var opts = new Map();
        var config = this.props.fields[4].configurations.Load;
        var configs = new Map();
        config.forEach((item)=>{
            configs.set(item, false);
        })
        this.props.fields.forEach((field)=>{
            if(field.type === "select"){
                opts.set(field.label, {
                    options: field.options,
                    currentvalue: field.options[0]
                });


            }
        })

        this.state = {
            opts: opts,
            configs: configs
        }
    }

    componentWillReceiveProps(nextProps){
        console.log(nextProps)
    }
    handleSelectChange(key, event){
        var opt = this.state.opts.get(key);;
        opt.currentvalue = event.target.value;
        this.props.callback(opt.currentvalue);
        if(event.target.name === "Parent Driver"){
            var configs = this.props.fields[4].configurations[event.target.value];
            console.log(configs);
            var configMap = new Map();
             configs.forEach((item)=>{
                 console.log(item)
                 configMap.set(item, false);
             })
        }
        
        this.setState((prevState, prop)=>({
            opts: prevState.opts.set(key, opt),
            configs: configMap
        }));

        
    }

    handleCheckboxChange(key, event){
        var configs = this.state.configs;

        configs.set(key, !configs.get(key))
        this.setState((prevState, props)=>({
            configs: configs
        }));
    }
    handleSubmit(event){
        event.preventDefault();
        var obj = {};
        for(var i = 0; i < event.target.length-1; i++){
            var input = event.target[i];
            
            if(input.type === "checkbox"){
                obj[input.name] = input.checked;
            }
            else{
                obj[input.name] = input.value;
            }
        }

        
        this.props.submissionCallBack(obj);
    }
    render(){
        var forminputs = [];
        var config = ["config 1", "config 2", "config 3"]
        this.props.fields.forEach((field)=>{

            if(field.type === "select"){
                var opts = this.state.opts.get(field.label);

                var optsUI = [];
                opts.options.forEach((opt)=>{
                    optsUI.push(<option value={opt}>{opt}</option>);
                })

                forminputs.push(
                    <div className="form-group">
                        <label className="control-label mb-10 text-left">{field.label}</label>
                        <select className="form-control" name={field.label} value={opts.currentvalue} onChange={this.handleSelectChange.bind(this, field.label)} required>
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
        this.state.configs.forEach((value, key)=>{

            forminputs.push
            (<div style={{width: "100%"}}>
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
        })
        return(
            <div className="form-wrap">
                <form onSubmit={this.handleSubmit.bind(this)}>
                    {forminputs}
                    <button type="submit" className="btn btn-success btn-block">Submit</button>
                </form>
            </div>
        )
    }
}

Form.defaultProps = {
    callback: null,
    config: ["config 1", "config2", "config3"],
    fields: null
}