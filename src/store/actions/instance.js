import { CHANGE_SERVICE, CHANGE_HEADER, CHANGE_HOST, CHANGE_AUTH, CHANGE_NAME, CHANGE_PATH, REDIRECT} from "./instanceactions.js"

export const changeService = (service, view)=>{
    return {
        type: CHANGE_SERVICE,
        payload: {service: service, view: view}
    }
}

export const changeAuth = (auth)=>{
    return {
        type: CHANGE_AUTH, 
        payload: auth
    }
}

export const changeHeader = (header)=>{
    return {
        type: CHANGE_HEADER,
        payload: header
    }
}

export const changePath = (path)=>{
    return {
        type: CHANGE_PATH,
        payload: path
    }
}

export const changeHost = (host)=>{
    return {
        type: CHANGE_HOST,
        payload: host
    }
}

export const changeName = (name)=>{
    return {
        type: CHANGE_NAME,
        payload: name
    }
}

export const redirect = (view)=>{
    return {
        type: REDIRECT,
        payload: view
    }
}