import React from "react";

export default class Panel extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            header: this.props.header,
            body: this.props.body,
        }
    }
    UNSAFE_componentWillReceiveProps(nextProps){
            this.setState({
                header: nextProps.header,
                body: nextProps.body
            })
        }

        render(){
            return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="card-view panel panel-default">
                        <div className="panel-heading">
                            <div className="pull-left" style={{width: "100%"}}>
                                <h6 className="panel-title txt-dark">{this.state.header}</h6>
                            </div>
                        </div>
                        <div className="clearfix"></div>
                        
                        <div className="panel-wrapper collapse in">
                            <div className="panel-body">
                                {this.state.body}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
}

Panel.defaultProps = {
    header: "",
    body: ""
}