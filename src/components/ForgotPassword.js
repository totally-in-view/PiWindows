import Panel from "./Panel";
import React from "react";

export default class ForgotPassword extends React.Component {
    constructor(props){
        super(props)
        this.state ={ 
            alertMessage: null
        }
    }
    componentDidMount(){
        this.props.socket.on("reset-password-success", (message)=>{
            this.setState({
                alertMessage: <div className="success-message"><div>Success: {message}</div></div>
            })
        });
        this.props.socket.on("reset-password-error", (message)=>{
            this.setState({
                alertMessage: <div className="error-message"><div>Error: {message}</div></div>
            })
        })
    }
    resetPassword(event){
        event.preventDefault();
        let resetInfo = {};
        let elements = event.target.elements;
        for(let i = 0; i < elements.length; i++){
            let el = elements[i];
            let id=  el.id;
            resetInfo[id] = el.value
        }

        this.props.socket.emit("reset-password", resetInfo);
    }
    render(){
        return(
            <Panel header={"Forget Password"} body={
                <div>
                    {this.state.alertMessage}
                    <div className="form-wrap mt-10">
                        <form onSubmit={this.resetPassword.bind(this)}>
                            <div className="row">
                                <div className="col-sm-12">
                                    <input type="email" id="email" placeHolder="Email Address" className="form-control" required/>
                                </div>
                                
                            </div>
                            <div className="row mt-20">
                                <div className="col-sm-6">
                                    <div style={{color: "#fff", cursor: "pointer"}} onClick={()=>{
                                        this.props.to("Register");
                                    }}>Don't have an account? Sign Up!</div>
                                </div>
                                <div className="col-sm-6">
                                    <button className="btn btn-primary" type="submit">Reset Password</button>
                                </div>
                            </div>                
                        </form>
                    </div>
                </div>
            } />
        )
        
    }
}