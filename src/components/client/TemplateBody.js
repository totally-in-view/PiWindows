import React from "react";

export default class TemplateBody extends React.Component {
    constructor(props){
        super(props)
    }


    render(){
        return(
            <div className={this.props.class} id={this.props.id}>
                {this.props.children}
            </div>
        )
    }
}

TemplateBody.defaultProps = {
    class: "",
    id: "",
    children: ""
}