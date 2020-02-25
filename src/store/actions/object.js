import { TOUCH, UPDATE } from "./objectactions";


export const touch = (btn)=>{
        return{
            type: TOUCH,
            payload: btn
        }
}

export const update = (device)=>{
    return {
        type: UPDATE,
        payload: device
    }
}