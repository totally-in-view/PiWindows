import Panel from "./Panel";
import React from "react";

export default class Register extends React.Component {
    constructor(props){
        super(props);
        this.passwordRef = React.createRef();

        this.state = {
            passwordMessage: "",
            confirmPassword: false,
            passwordApproved: false,
            errorMessage: null
        }
    }

    componentDidMount(){
        this.props.socket.on("register-error", (message)=>{
            this.setState({
                errorMessage: <div className="error-message"><div>Error: {message}</div></div>
            })
        })
    }

    checkPassword(event){
        let password = event.target.value;
        let lengthMessage = "8 Characters",
            capitalMessage = "1 Capital Letter",
            lowercaseMessage = "1 Lowercase Letter",
            numberMessage =  "1 Number",
            specialMessage = `1 Special Character${this.props.SPECIALCHARS.toString().replace(",", ", ")}`
        let passwordChecker = "Cannot contain word \"password\""
        let messages = [lengthMessage, capitalMessage, lowercaseMessage, numberMessage, specialMessage, passwordChecker];
        let specialCharFound = false,
            capitalCharFound = false,
            lowercaseCharFound = false,
            numberFound = false,
            lengthGreaterThan7 =  false,
            wordPasswordFound = false;
        for(const char of this.props.SPECIALCHARS){
            if(password.indexOf(char) > -1){
                messages = messages.filter((message)=>{
                    return message !== specialMessage
                })
                break;
            }
        }

        for(const number of this.props.NUMBERS){
            if(password.indexOf(number) > -1){
                messages = messages.filter((message)=>{
                    return message !== numberMessage
                })
                break;
            }
        }

        for(const letter of this.props.CAPITAL_LETTERS){
            if(password.indexOf(letter) > -1){
                messages = messages.filter((message)=>{
                    return message !== capitalMessage
                })
            }

            if(password.indexOf(letter.toLowerCase()) > -1){
                messages = messages.filter((message)=>{
                    return message !== lowercaseMessage
                })
            }
        }

        if(password.length >= 8){
            messages = messages.filter((message)=>{
                return message !== lengthMessage
            })
        }

        if(!password.toLowerCase().includes("password") && !password.toLowerCase().includes("p@ssword") && !password.toLowerCase().includes("passw0rd") && !password.toLowerCase().includes("p@ssw0rd")){
            messages = messages.filter((message)=>{
                return message !== passwordChecker
            })
        }
        let message =  messages.length === 0 ? null : <div className="help-block with-errors">
                            Password doesn't follow the following credentials
                            <ul className="list-unstyled">
                                {messages.map((errorMessage)=>{
                                    return <li>{errorMessage}</li>
                                })}
                            </ul>
                        </div>
        let passwordApproved = messages.length === 0 ? true : false;
        this.setState({
            passwordMessage: message, 
            passwordApproved: passwordApproved
        })
    }
    confirmPassword(event){
        let password = this.passwordRef.current;
        if(password.value == event.target.value){
            
            this.setState({
                confirmPassword: true
            })
        }
    }

    register(event){
        let registerInfo = {};
        event.preventDefault();
        let elements = event.target.elements;

        for(let i = 0; i < elements.length; i++){
            let el = elements[i];
            let id = el.id;
            if(id !== null){
                registerInfo[id] = el.value
            }
        }
        if(this.state.passwordApproved === true && this.state.confirmPassword == true){
            this.props.socket.emit("register-user", registerInfo);
        }else{
            this.setState({
                errorMessage:  <div className="error-message"><div>Error: Password Mismatch</div></div>
            })
        }

    }

    render(){
        return(
            <Panel header={"Register"} body={
                <div>
                {this.state.errorMessage}
                <div className="form-wrap mt-10">
                    <form onSubmit={this.register.bind(this)}>
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <input type="text" id="firstname" placeHolder="First Name" className="form-control" required/>
                                </div>
                                <div className="form-group">
                                    <input type="email" id="email" placeHolder="JohnDoe@email.com" className="form-control" required/>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <input type="text" id="lastname" placeHolder="Last Name" className="form-control" required/>
                                </div>
                                <div className="form-group">
                                    <input type="tel" id="phonenumber" placeHolder="123-456-6789" className="form-control" required/>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <input type="text" id="company" placeHolder="Company" className="form-control" required/>
                                </div>
                                <div className="form-group">
                                    <input type="text" id="address"placeHolder="Street Address" className="form-control" required/>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <input type="text" id="city" placeHolder="City" className="form-control" required/>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <select className="form-control" id="state">
                                        {this.props.STATES.map((state)=>{
                                            return <option>{state}</option>
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <input type="text" id="postcode" placeHolder="Postal Code" className="form-control" required/>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <input onChange={this.checkPassword.bind(this)} ref={this.passwordRef}id="password" type="password" placeHolder="Password" className="form-control" required/>
                                    {this.state.passwordMessage}
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className={`form-group`}>
                                    <input onChange={this.confirmPassword.bind(this)}type="password" placeHolder="Confirm Password" className="form-control" required/>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <div style={{color: "#fff", cursor: "pointer"}} onClick={()=>{
                                    this.props.to("Login");
                                }}>Have an account? Log in!</div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <button className="btn btn-primary" type="submit">Register</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                </div>
            }/>
        )
    }
}

Register.defaultProps = {
    SPECIALCHARS: ["!", "@", "#", "$", "%", "^", "&", "*", "(",")"],
    NUMBERS: [1, 2, 3, 4, 5, 6, 7,8, 9],
    STATES: [
        "AK",
        "AL",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY"],
        CAPITAL_LETTERS: [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "T",
            "U",
            "V",
            "W",
            "X",
            "Y",
            "Z"    
        ]
}