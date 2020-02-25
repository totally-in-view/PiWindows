import { ASSIGN_INSTANCE, GET_AVAILABLE_DRIVERS, INITIALIZE_DEVICES,CHANGE_ORIGIN, OPEN_DRIVER_BINDER, SELECT_DEVICE, REMOVE_DEVICE, CLOSE_DRIVER_BINDER, BIND_DEVICE, LOADING } from "./deviceeditoractions"
import React from "react";
import {Redirect} from "react-router-dom"

export function changeOrigin(origin){
    return {
        type: CHANGE_ORIGIN,
        payload: origin
    }
}


export function assignInstance(instance, view = null){
    var redirect = <Redirect path="/add-device/instance" />;
    if(view != null){
        redirect = view;
    }
    return{
        type: ASSIGN_INSTANCE,
        payload: {
            currentInstance: instance,
            view: redirect
        }
    }
}

export function initializeDevices(devices, redirect){
    return{
        type: INITIALIZE_DEVICES,
        payload: {
            devices: devices,
            view: redirect
        }
    }
}

export function openDriverBinder(isOpen, view){
    return {
        type: OPEN_DRIVER_BINDER,
        payload: {open: isOpen, view: view}
    }
}

export function closeDriverBinder(isOpen, view){
    return{
        type: CLOSE_DRIVER_BINDER,
        payload: {
            open: isOpen,
            view: view
        }
    }
}

export function getDrivers (drivers){
    return {
        type: GET_AVAILABLE_DRIVERS, 
        payload: drivers
    }
}

export function selectDevice(device){
    console.log(device);
    return {
        type: SELECT_DEVICE,
        payload: device
    }
}

export function loading(loadscreen){
    return {
        type: LOADING,
        payload: loadscreen
    }
}


export function removeDevice(device){
    return {
        type: REMOVE_DEVICE,
        payload: device
    }
}

export async function bindDevice(device, drivers){
    var boundDevice;
    
    try{
        boundDevice = await bindingDevice(device, drivers);
    }catch(err){
        console.log(err);
    }
            return {
                type: BIND_DEVICE,
                payload: boundDevice
            }

}


function bindingDevice(device, drivers){
    var VantageLoad;
    var VantageHVAC;
    var boundDevice;
    drivers.forEach((driver)=>{
        if(driver.props.type == "VantageLoad"){
            VantageLoad = driver;
        }else if(driver.props.type == "VantageHVAC"){
            VantageHVAC = driver;
        }
        return{
            type: BIND_DEVICE,
            payload: boundDevice
        }
    })

    switch(device.type){
        case "Load":
            boundDevice = {...VantageLoad};
            boundDevice.props.id = device.vid;
            boundDevice.props.name = device.name;
            boundDevice.props.area = device.area;
            return boundDevice
        case "Thermostat":
        boundDevice = {...VantageHVAC};
        boundDevice.props.id = device.vid;
        boundDevice.props.name = device.name;
        boundDevice.props.area = device.area;
            return boundDevice;
        default:
            return boundDevice

    }
}