import {ACTIVATE_ITEM, ADD_ITEMS} from "../actions/sidebaractions";

var initialState = {
    active: "Dashboard",
    listitems: [
        {
            name: "Main",
            items: [ "Dashboard", "Schedules","Add Driver", "Add Device", "Add Instance","Template Editor", "Vantage Terminal", "Diagnostics","Settings"]
        },
        {
            name: "Instances",
            items: []
        },
        {
            name: "Devices",
            items: []
        }
    ]
}

const reducer = (state = initialState, action)=>{
    switch(action.type){
        case ACTIVATE_ITEM:
            return {
                ...state,
                active: action.payload
            };
        case ADD_ITEMS:
            return {
                ...state,
                listitems: [...action.payload]
            }
        
        default:
            return state;
    }
}

export default reducer;