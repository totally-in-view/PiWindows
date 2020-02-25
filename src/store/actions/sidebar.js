import {
    ACTIVATE_ITEM,
    ADD_ITEMS,
    UPDATE_SIDEBAR
} from "./sidebaractions";

export const activateItem = (item)=>{
    return {
        type: ACTIVATE_ITEM,
        payload: item
    };
}

export const addItems = (list)=>{
    console.log(list)
    return {
        type: ADD_ITEMS,
        payload: [...list]
    };
}

export const updateSidebar = (list)=>{
    console.log(list)
    return {
        type: UPDATE_SIDEBAR,
        payload: [...list]
    }
}
