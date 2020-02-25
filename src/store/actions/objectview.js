import {UPDATE_VIEW} from "./objectviewactions"

export const updateView = (type,objects)=>{
    return {
        type: UPDATE_VIEW,
        payload: {type: type, objects: objects}
    }
}