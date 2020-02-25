export const TOUCH = "TOUCH";
export const UPDATE = "UPDATE";

const update = (device)=>{
    return {
        type: UPDATE,
        payload: {...device}
    };
}

