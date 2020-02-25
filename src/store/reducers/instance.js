import { CHANGE_SERVICE, CHANGE_HEADER, CHANGE_HOST, CHANGE_AUTH, CHANGE_NAME, CHANGE_PATH, REDIRECT } from "../actions/instanceactions";
import React from "react";
import {Redirect} from "react-router-dom";
var initialState = {
    service: "",
    name: "",
    payload: "",

    auth: null,
    path: null,

    header: null,

    view: <Redirect to="/add-instance/telnet"/>
}
const reducer = (state = initialState, action)=>{
    switch(action.type){
        case CHANGE_SERVICE: 
            return {
                ...state,
                service: action.payload.service,
                view: action.payload.view
            };
        case CHANGE_HOST: 
            return {
                ...state,
                host: action.payload
            }
        case CHANGE_HEADER: 
            return {
                ...state,
                header: action.payload
            }
        case CHANGE_NAME: 
            return {
                ...state,
                name: action.payload
            }
        case CHANGE_AUTH:
            return {
                ...state,
                auth: action.payload
            }
        case CHANGE_PATH: 
            return {
                ...state,
                path: action.payload
            }
        case REDIRECT:
            return {
                ...state,
                view: action.payload
            }
        default: 
            return state;
    }
}

export default reducer;