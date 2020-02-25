import React from "react";
import ReactJSON from "react-json-view";

export default class RESTWindow extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            currentMethod: "GET",
            methodsHidden: "hidden",
            bodyState: "code",
            token: {
                auth: "",
                token: ""
            },
            code: "",
        }
    }
    changeAuth(event){
        var token = this.state.token;
        console.log(event.target.value)
        token.auth = event.target.value
        this.setState({
            token: token
        })
    }

    changeToken(event){
        if(event.key == "Enter"){
            event.preventDefault();
            var token = this.state.token;
            token.token = event.target.textContent
            
            this.setState({
                token: token
            });
        }
    }
    showToken(){
        this.setState((prevState, props)=>({
            bodyState: "token"
        }));
    }

    showCode(){
        this.setState((prevState, props)=>({
            bodyState: "code"
        }))
    }
    showMethods(){
        this.setState({
            methodsHidden: ""
        });
    }

    hideMethods(){
        this.setState({
            methodsHidden: "hidden"
        })
    }

    tab(event){
       if(event.keyCode === 9){
           event.preventDefault();
           var code = this.state.code;
           this.setState({
               code:  `${code}\t`
           })
       }
    }

    codeBody(event){
        console.log(event.target.value)
        this.setState({
            code: event.target.value
        })
    }
    showResponseCode(){
         
    }

    showQualifiers(){

    }
    render(){
        var body;

        if(this.state.bodyState == "token"){
            body = <div>
                        <div className="authorization">Bearer/Path: <select onChange={this.changeAuth.bind(this)} value={this.state.token.auth}><option name="Bearer">Bearer</option><option name="Bearer">Path</option></select></div>
                        <div className="token">Token: <div onKeyPress={this.changeToken.bind(this)} contentEditable>{this.state.token.token}</div></div>
                   </div>
        }
        else{
            body = <textarea className="code" onKeyDown={this.tab.bind(this)} onChange={this.codeBody.bind(this)} value={this.state.code}/>
        }
        
        return(
            <div className="rest-window">
            <div className="request-header">
                        <div className="request-type">
                            <div className="current-request" onMouseEnter={this.showMethods.bind(this)} onMouseLeave={this.hideMethods.bind(this)}><div className="method GET">GET</div></div>
                            {/* <div className="methods">
                                <div className="method GET">GET</div>
                                <div className="method POST">POST</div>
                                <div className="method PUT">PUT</div>
                                <div className="method DELETE">DELETE</div>
                           </div> */}
                        </div>
                        <div className="request-path" contentEditable></div>
                    </div>
                <div class="rest-body">
                    <div className="rest-request">
                        <div className="request-body">
                            <div className="body-header">Body <div className="body-toggles"><div className="body-toggle" onClick={this.showToken.bind(this)}>Token</div><div className="body-toggle" onClick={this.showCode.bind(this)}>Code</div></div></div>
                            <div className="body">{body}</div>
                        </div>
                    </div>
                    <div className="rest-response"> 
                        <div className="body-header">Response <div className="body-toggles"><div className="body-toggle" onClick={this.showToken.bind(this)} onClick={this.showQualifiers.bind(this)}>Qualifiers</div><div className="body-toggle" onClick={this.showResponseCode.bind(this)}>Code</div></div></div>
                        <div className="body"></div>
                    </div>
                </div>
            </div>
        )
    }
}

RESTWindow.defaultProps = {
    json: {
        "1": {
                "state": {
                    "on": false,
                    "bri": 1,
                    "hue": 33761,
                    "sat": 254,
                    "effect": "none",
                    "xy": [
                        0.3171,
                        0.3366
                    ],
                    "ct": 159,
                    "alert": "none",
                    "colormode": "xy",
                    "mode": "homeautomation",
                    "reachable": true
                },
                "swupdate": {
                    "state": "noupdates",
                    "lastinstall": "2017-10-15T12:07:34"
                },
                "type": "Extended color light",
                "name": "Hue color lamp 7",
                "modelid": "LCT001",
                "manufacturername": "Philips",
                "productname": "Hue color lamp",
                "capabilities": {
                    "certified": true,
                    "control": {
                        "mindimlevel": 5000,
                        "maxlumen": 600,
                        "colorgamuttype": "B",
                        "colorgamut": [
                            [
                                0.675,
                                0.322
                            ],
                            [
                                0.409,
                                0.518
                            ],
                            [
                                0.167,
                                0.04
                            ]
                        ],
                        "ct": {
                            "min": 153,
                            "max": 500
                        }
                    },
                    "streaming": {
                        "renderer": true,
                        "proxy": false
                    }
                },
                "config": {
                    "archetype": "sultanbulb",
                    "function": "mixed",
                    "direction": "omnidirectional"
                },
                "uniqueid": "00:17:88:01:00:bd:c7:b9-0b",
                "swversion": "5.105.0.21169"
            },
            "2": {
                "state": {
                    "on": false,
                    "bri": 1,
                    "hue": 35610,
                    "sat": 237,
                    "effect": "none",
                    "xy": [
                        0.1768,
                        0.395
                    ],
                    "ct": 153,
                    "alert": "none",
                    "colormode": "xy",
                    "mode": "homeautomation",
                    "reachable": true
                },
                "swupdate": {
                    "state": "noupdates",
                    "lastinstall": "2017-10-18T12:50:40"
                },
                "type": "Extended color light",
                "name": "Hue lightstrip plus 1",
                "modelid": "LST002",
                "manufacturername": "Philips",
                "productname": "Hue lightstrip plus",
                "capabilities": {
                    "certified": true,
                    "control": {
                        "mindimlevel": 40,
                        "maxlumen": 1600,
                        "colorgamuttype": "C",
                        "colorgamut": [
                            [
                                0.6915,
                                0.3083
                            ],
                            [
                                0.17,
                                0.7
                            ],
                            [
                                0.1532,
                                0.0475
                            ]
                        ],
                        "ct": {
                            "min": 153,
                            "max": 500
                        }
                    },
                    "streaming": {
                        "renderer": true,
                        "proxy": true
                    }
                },
                "config": {
                    "archetype": "huelightstrip",
                    "function": "mixed",
                    "direction": "omnidirectional"
                },
                "uniqueid": "00:17:88:01:02:15:97:46-0b",
                "swversion": "5.105.0.21169"
            }
        }
}