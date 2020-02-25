import React, {Component} from "react";

export default class MultiSelect extends Component {
    constructor(props){
        super(props);

        this.state = {
            dropdownVisible: "none",
            options: []
        }
    }

    toggleDropdown(){
        if(this.state.dropdownVisible === "none"){
            this.setState({
                dropdownVisible: "flex"
            })
        }
        else{
            this.setState({
                dropdownVisible: "none"
            })
        }
    }
    toggleOption(event){
        var options = this.state.options;
        var option = event.target.value;

        if(this.state.options.indexOf(option) > -1){
            options = options.filter(opt=> opt !== option);
        }else{
            
            options.push(option);
            if(this.props.sort !== false){
                this.props.sort(options);
            }
            if(this.props.select !== null){
                this.props.select(option)
            }  
        }
        
        this.setState({
            options: options
        })
    }
    render(){
        var selectOptions = [];
        var selectedString;

        if(this.state.options.length === 0 && this.props.sort !== false){
            selectedString = "Sort By"
        }else{
            selectedString = "";
            for(var i = 0; i < this.state.options.length; i++){
                var option = this.state.options[i];
                if(i === this.state.options.length-1){
                    selectedString += `${option}`
                }
                else{
                    selectedString += `${option}, `
                }
            }
        }
        this.props.options.forEach((option)=>{
            if(this.state.options.indexOf(option) >= 0){
                selectOptions.push(<option className="option-selected">{option}</option>)
            }else{
                selectOptions.push(<option>{option}</option>);
            }
        })
        return(
            <div className="form-group">
                <div className="btn-group bootstrap-select show-tick">
                <button type="button" onClick={this.toggleDropdown.bind(this)} className="btn dropdown-toggle form-control btn-default btn-outline multi-select-values" data-toggle="dropdown" role="button" title={selectedString} aria-expanded="false"><span className="filter-option pull-left">{selectedString}</span>&nbsp;<span className="bs-caret"><span className="caret" /></span></button>            
                    <select onChange={this.toggleOption.bind(this)} style={{display: this.state.dropdownVisible, position: "absolute", top: "45px"}} className="selectpicker multi-select-picker" multiple data-style="form-control btn-default btn-outline" tabIndex={-98}>
                        {selectOptions}
                    </select>
                </div>
            </div>
        )
    }
}