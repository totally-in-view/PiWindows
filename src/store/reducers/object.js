import {TOUCH, UPDATE} from "../actions/objectactions";

var initialState = {
    info: {},
    actions: []
}

const reducer = (state = initialState, action)=>{
    switch(action.type){
        case UPDATE: 
            return {
                ...state,
                ...action.payload
            }
        default:
            return state;
    }
}

export default reducer