import {UPDATE_VIEW} from "../actions/objectviewactions";
var initialState = {
    type: "",
    objects: []
}
export const reducer = (state = initialState, action)=>{
    switch(action.type){
        case UPDATE_VIEW:
            return {
                ...state,
                type: action.payload.type,
                objects: action.payload.objects
            }
        default: 
            return state
        }
}

