import {
    TO_SCREEN,
    FILE_GET_FILE, 
    FILE_GET_AREAS, 
    FILE_GET_DEVICE_TYPES,
    FILE_ADD_INSTANCE,
    FILE_ADD_DEVICE,
    FILE_ADD_EVENT,
    APP_ADD_DRIVER,
    APP_UPDATE_SOCKET,
    APP_UPDATE_LOG,
    CHANGE_PERMISSIONS,
    GET_MANIFEST,
    GET_DEVICEMAP,
    LOADING,
    APP_UPDATE_DEVICE_COUNT,
    APP_UPDATE_INSTANCE_COUNT,
    APP_ADD_USER_ID,
    APP_UPDATE_PROGRESS
} from "../actions/rootactions";

import React from "react";
import {Redirect} from "react-router";
import io from "../../../node_modules/socket.io-client"
let socket = io("http://localhost:3031", { timeout: 360000, pingTimeout: 30000, transports: ['websocket'], upgrade: false, forceNew: false });
socket.emit("start-up")

var initialState = {
    screen: <Redirect to="/login"/>,
    drivers: [],
    file: {
        devices: [],
        instances: [],
        events: [],
    },
    deviceStatusCount: {
        online: 0,
        offline: 0
    },
    instanceStatusCount: {
        online: [],
        offline: []
    },
    deviceMap: [],
    permissions: "",
    loading: false,
    socket: socket,
    loggedIn: false,
    progress: null
}

const reducer = (state = initialState, action)=>{
    switch(action.type){
        case TO_SCREEN:
            return {
                ...state,
                screen: action.payload
            };
        case FILE_ADD_INSTANCE: 
        var file = state.file;
        file.instances = [...file.instances, action.payload]   

        return {
                ...state,
                file: {...file},
            }
        case FILE_ADD_DEVICE: 
        var file = state.file;
        file.devices = [...file.devices, action.payload];
            return{
                ...state,
                file: file
            }
        case FILE_ADD_EVENT:
            var file = state.file;
            file.events = [...file.events, action.payload];
            return {
                ...state,
                file: file
            }
        case FILE_GET_FILE: 
        var instances = [];
        action.payload.instances.forEach((instance)=>{
            if(instance.aliases.length === 0){
                instances.push(instance.name)
            }else{
                instance.aliases.forEach((alias)=>{
                    instances.push(alias)
                })
            }
        });
            return {
                ...state,
                file: action.payload,
            }
        case APP_ADD_DRIVER:
            return {
                ...state,
                drivers: [...state.drivers, ...action.payload]
            }
        case APP_UPDATE_SOCKET:
            let socket = state.socket;
            socket.open();
            return {
                ...state,
                socket: socket
            }
        case CHANGE_PERMISSIONS:
            return {
                ...state,
                permissions: action.payload
            }

        case GET_MANIFEST:
            return {
                ...state,
                drivers: action.payload
            }
        case APP_UPDATE_LOG:
            let logs = state.logs;
            if(logs.has(action.payload.instance)){
                logs.set(action.payload.instance, [...logs.get(action.payload.instance), action.payload.log]);
            }else{
                logs.set(action.payload.instance, [action.payload.log]);
            }
            return{
                ...state,
                logs: logs
            }
        case GET_DEVICEMAP:
            return {
                ...state,
                deviceMap: action.payload
            }
        case LOADING:
            return {
                ...state,
                loading: action.payload
            }
        case APP_UPDATE_DEVICE_COUNT:
            return {
                ...state,
                deviceStatusCount: action.payload
            }
        case APP_UPDATE_INSTANCE_COUNT:
            return {
                ...state,
                instanceStatusCount: action.payload
            }
        case APP_ADD_USER_ID:
            let stateSocket = state.socket;
            stateSocket.nickname = action.payload
            return{
                ...state,
                socket: stateSocket
            }
        case APP_UPDATE_PROGRESS:
            return {
                ...state,
                progress: action.payload
            }
        default:
            return state;
    }
}

export default reducer;