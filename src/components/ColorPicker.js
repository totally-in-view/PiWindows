import React from "react";

export default class ColorPicker extends React.Component {
    constructor(props){
        super(props);
    }

    handleColorChange(event){
        console.log(event.target.value)
    }

    render(){
        return (
            <div id="cp3" className="colorpicker-rgb input-group colorpicker-component colorpicker-element">
                <input onChange={this.handleColorChange.bind(this)} type="color" defaultValue="#00AABB" className="form-control" />
            </div>
        )
    }
}