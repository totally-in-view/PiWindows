import {
    TO_SCREEN,
    FILE_GET_FILE,
    FILE_GET_AREAS,
    FILE_GET_DEVICE_TYPES,
    FILE_ADD_INSTANCE,
    FILE_ADD_DEVICE,
    FILE_ADD_EVENT,
    APP_ADD_DRIVER,
    APP_UPDATE_SIDEBAR,
    APP_UPDATE_SOCKET,
    APP_UPDATE_DEVICE_COUNT,
    CHANGE_PERMISSIONS,
    GET_MANIFEST,
    APP_UPDATE_LOG,
    GET_DEVICEMAP,
    LOADING,
    APP_UPDATE_INSTANCE_COUNT,
    APP_ADD_USER_ID,
    APP_UPDATE_PROGRESS
} from "./rootactions"

import React from "react";

import Sidebar from "../../components/Sidebar";
export const toScreen = (screen)=>{
    return {
        type: TO_SCREEN,
        payload: screen
    }
}

export const getFile = (file)=>{
    return {
        type: FILE_GET_FILE,
        payload: file
    }
}

export const getAreas = (areas, file)=>{
    file.devices.forEach((device)=>{
        if(areas.indexOf(device.props.area) < 0){
            areas.push(device.props.area);
        }
    })
    return {
        type: FILE_GET_AREAS,
        payload: areas.sort()
    }
}

export const getDeviceTypes = (devices, file)=>{
    file.devices.forEach((device)=>{
        if(devices.indexOf(device.props.type) < 0){
            devices.push(device.props.type);
        }
    })
    return {
        type: FILE_GET_DEVICE_TYPES,
        payload: devices.sort()
    };
}

export const addInstance = (instance)=>{
    return {
        type: FILE_ADD_INSTANCE,
        payload: instance
    }
}

export const addDriver = (driver) =>{
    return {
        type: APP_ADD_DRIVER,
        payload: driver
    }
}

export const addDevice = (device)=>{
    return{
        type: FILE_ADD_DEVICE,
        payload: device
    }
}

export const addEventToFile = (event)=>{
    return {
        type: FILE_ADD_EVENT,
        payload: event
    }
}

export const updateSidebar = (listitems, to) =>{
    return {
        type: APP_UPDATE_SIDEBAR,
        payload: <Sidebar listitems={listitems} to={to}/>
    }
}

export const updateSocket = () => {

    return {
        type: APP_UPDATE_SOCKET,
    }
}

export const changePermissions = (permissions) =>{
    return {
        type: CHANGE_PERMISSIONS,
        payload: permissions
    }
}

export const getManifest = (manifest)=>{
    return {
        type: GET_MANIFEST,
        payload: manifest
    }
}

export const updateLog = (log, instance)=>{
    return {
        type: APP_UPDATE_LOG,
        payload: {
            log: log,
            instance: instance.id
        }
    }
}

export const getDeviceMap = (map)=>{
    return{
        type: GET_DEVICEMAP,
        payload: map
    };
}

export const isLoading = (isLoading)=>{
    return {
        type: LOADING,
        payload: isLoading
    }
}

export const updateDeviceCount = (deviceCount)=>{
    return {
        type: APP_UPDATE_DEVICE_COUNT,
        payload: deviceCount
    }
}

export const updateInstanceCount = (instanceCount)=>{
    return {
        type: APP_UPDATE_INSTANCE_COUNT,
        payload: instanceCount
    }
}

export const addUserId = (id)=>{
    return {
        type: APP_ADD_USER_ID,
        payload: id
    }
}

export const updateProgress = (instance, level, totalProgress)=>{
    return {
        type: APP_UPDATE_PROGRESS,
        payload: {instance: instance, level: level, totalProgress: totalProgress}
    }
}