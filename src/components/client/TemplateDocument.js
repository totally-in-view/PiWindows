import React from "react";
import Header from "./TemplateHeader";
import Sidebar from "TemplateSidebar";
import Body from "TemplateBody";
import Footer from "TemplateFooter"

class TemplateDocument extends React.Component{
    constructor(props){
        super(props)
    }

    render(){
        return(
            <div>
                {this.props.header}
                {this.props.body}
                {this.props.footer}
            </div>
        )
    }
}


TemplateDocument.defaultProps = {
    header: <TemplateHeader />,
    body:   <TemplateBody>
                <TemplateSidebar />
            </TemplateBody>,
    footer: <TemplateFooter />
}