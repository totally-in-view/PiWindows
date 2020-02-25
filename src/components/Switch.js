import React from "react";

export default class Switch extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            status: "on"
        }
    }
    toggle(){
        if(this.state.status == "on"){
            this.props.click();
            this.setState({
                status: "off"
            })
        }
        else{

            this.props.click()
            this.setState({
                status: "on"
            })
        }
    }
    render(){
        return(
            <div>
            <input type="checkbox" defaultChecked className="js-switch js-switch-1" data-color="#469408" data-size="large" data-switchery="true" style={{display: 'none'}} />
            <span className={`switchery switchery-large switch-${this.state.status}`}><small onClick={this.toggle.bind(this)}/>
            </span>
            </div>

        )
    }
}