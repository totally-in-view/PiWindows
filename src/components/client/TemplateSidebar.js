import React from "react";

export default class TemplateSidebar extends React.Component {
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

TemplateSidebar.defaultProps = {
    class: "",
    id: "",
    children: ""
}