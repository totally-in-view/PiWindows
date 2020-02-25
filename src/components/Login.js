import Panel from "./Panel";
import React from "react";

export default class Login extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            errorMessage: null
        }
    }

    componentDidMount(){
        this.props.socket.on("login-error", (message)=>{
            this.setState({
                errorMessage: <div className="error-message"><div>Error: {message}</div></div>
            })
        })
    }
    login(event){
        event.preventDefault();
        let login = {};
        let elements = event.target.elements;
        for(let i = 0; i < elements.length; i++){
            let el = elements[i];
            let id = el.id;
            login[id] = el.value;
        }

        this.props.socket.emit("login", login);
    }


    render(){
        return (
            <Panel header={"Login"} body={
                <div>
                    {this.state.errorMessage}
                <div className="form-wrap mt-10">
                <form onSubmit={this.login.bind(this)}>
                 
                <div className="row">
                    <div className="col-sm-12">
                        <div className="form-group">
                            <input type="email" id="email" placeHolder="Email Address" className="form-control" required/>
                        </div>
                        <div className="form-group">
                            <input type="password" id="password" placeHolder="Password" className="form-control mb-10" required/>
                            <div style={{color: "#cdcdcd", cursor: "pointer"}} onClick={()=>{
                                this.props.to("Forget Password")
                            }}>Forgot password? Reset here!</div>
                        </div>
                    </div>
                    
                </div>
                <div className="row">
                    <div className="col-sm-6">
                        <div style={{color: "#fff", cursor: "pointer"}} onClick={()=>{
                            this.props.to("Register");
                        }}>Don't have an account? Sign Up!</div>
                    </div>
                    <div className="col-sm-6">
                        <div className="form-group">
                            <button className="btn btn-primary" type="submit">Login</button>
                        </div>
                    </div>
                </div>

                </form>
                </div>
                </div>
            } />
        )
    }
}