import { ASSIGN_INSTANCE, INITIALIZE_DEVICES, CHANGE_ORIGIN, OPEN_DRIVER_BINDER, CLOSE_DRIVER_BINDER, GET_AVAILABLE_DRIVERS, SELECT_DEVICE, REMOVE_DEVICE, BIND_DEVICE, LOADING} from "../actions/deviceeditoractions"
import React from "react";
import { Redirect } from "react-router-dom";
var initialState ={
    currentInstance: {
        service: "Telnet"
    },
    devices: [],
    view: <Redirect to="/add-device/instance" />,
    from: "File",
    driverBinderOpen: false,
    drivers: [],
    devicesSelected: []
} 

export default function reducer(state = initialState, action){
    switch(action.type){
        case ASSIGN_INSTANCE:
        return {
                ...state,
                currentInstance: action.payload.currentInstance,
                view: action.payload.view
            }
        case INITIALIZE_DEVICES:
            return{
                ...state,
                devices: action.payload.devices,
                view: action.payload.view
            }
        case CHANGE_ORIGIN:
            return {
                ...state,
                from: action.payload
            }
        case OPEN_DRIVER_BINDER:
            return {
                ...state,
                driverBinderOpen: action.payload.open,
                view: action.payload.view
            }
        case CLOSE_DRIVER_BINDER:
            return{
                ...state,
                driverBinderOpen: action.payload.open,
                view: action.payload.view
            }
        case GET_AVAILABLE_DRIVERS: 
            return{
                ...state,
                drivers: action.payload
            }
        case SELECT_DEVICE:
            return{
                ...state,
                devicesSelected: state.devicesSelected.concat(action.payload)
            }
        case REMOVE_DEVICE: 
            var devices = state.devicesSelected;
            var deviceToRemove = action.payload;
            var devicesAfterRemoval = []

            if(Array.isArray(deviceToRemove) == true){
                deviceToRemove.forEach((device)=>{
                    devices.filter((value, index, array)=>{
                        if(value != device){
                            devicesAfterRemoval.push(value);
                        }
                    });
                })
            }else{
                devices.filter((value, index, array)=>{
                    if(value != deviceToRemove){
                        devicesAfterRemoval.push(value);
                    }
                });
            }
            return {
                ...state,
                devicesSelected: devicesAfterRemoval
            }

            case BIND_DEVICE: 
                console.log(action.payload);
                var devices = [...state.devices];
                if(devices.length < 25){
                    devices.push(action.payload);
                }
                return {
                    ...state,
                    devices: devices
                }
            case LOADING:
                return {
                    ...state,
                    view: action.payload
                }
        default: 
            return state;
    }
}

