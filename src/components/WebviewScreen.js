import React from "react";

export default class WebviewScreen extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="web-view">
                <webview src={this.props.address} nodeintegration></webview>
            </div>
        )
    }
}