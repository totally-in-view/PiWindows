import {FIRST_STEP, SECOND_STEP, THIRD_STEP, GET_PARENT_DRIVERS} from "../actions/wizardactions"
var initialState = {
    wizard: {
        step: 1,
        first: "active",
        second: "disabled",
        third: "disabled",
    },

    driver: {
        id: "",
        parent: [],
        description: "",
        widget: "",
        actions: []
    },
    parentDrivers: [],
    functionCreatorOpen: false,
    functionOpened: "",
    view: ""
}

const reducer = (state = initialState, action)=>{
    switch(action.type) {
        case FIRST_STEP: 
            return {
                ...state,
                wizard: {...action.payload.wizard},
                driver: {...action.payload.driver},
                view: {...action.payload.view}
            }

        case SECOND_STEP: 
            return {
                ...state,
                wizard: {...action.payload.wizard},
                driver: {...action.payload.driver},
                functionCreatorOpen: action.payload.functionCreatorOpen,
                functionOpened: action.payload.functionOpened,
                view: {...action.payload.view}
            }
        
        case THIRD_STEP: 
            return {
                ...state,
                wizard: {...action.payload.wizard},
                driver: {...action.payload.driver},
                view: {...action.payload.view}
            }
        
        case GET_PARENT_DRIVERS:
            return {
                ...state,
                parentDrivers: action.payload
            }

        default:
            return state;
    }
};


export default reducer;