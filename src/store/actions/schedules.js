import { TO_NEXT_DAY, TO_NEXT_WEEK, TO_NEXT_MONTH, TO_PREVIOUS_DAY, TO_PREVIOUS_WEEK, TO_PREVIOUS_MONTH, TODAY, ADD_EVENT, EDIT_EVENT, DELETE_EVENT, CLOSE_EVENT_CREATOR, OPEN_EVENT_CREATOR, CHANGE_VIEW, NEXT, PREV, ADD_DEVICES} from "./scheduleactions"

export const toNextDay = ()=>{

}

export const toNextWeek = ()=>{

}

export const toNextMonth = ()=>{
    return {
        type: TO_NEXT_MONTH,
        payload: null
    }
}

export const toPreviousDay = ()=>{

}

export const toPreviousWeek = ()=>{

}

export const toPreviousMonth = ()=>{
    return {
        type: TO_PREVIOUS_MONTH,
        payload: null
    }
}

export const addEvent = (event)=>{
    console.log(event);
    return {
        type: ADD_EVENT,
        payload: {
            event: event,
            eventCreatorOpen: false
        }
    }
}

export const editEvent = ()=>{

}

export const deleteEvent = (event)=>{
    return {
        type: DELETE_EVENT,
        payload: event
    }
}

export const openEventCreator = ()=>{
    return {
        type: OPEN_EVENT_CREATOR,
        payload: true
    }
}

export const closeEventCreator = ()=>{
    return {
        type: CLOSE_EVENT_CREATOR,
        payload: false
    }
}

export const changeView = (view)=>{
    return {
        type: CHANGE_VIEW,
        payload: view
    }
}

export const next = ()=>{
    return {
        type: NEXT,
        payload: null
    }  
}

export const prev = ()=>{
    return {
        type: PREV,
        payload: null
    }
}

export const today = ()=>{
    return {
        type: TODAY,
        payload: null
    }
}

export const addDevices = (devices)=>{
    return {
        type: ADD_DEVICES,
        payload: devices
    }
}