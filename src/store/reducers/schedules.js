import { TO_NEXT_MONTH, TO_PREVIOUS_MONTH, OPEN_EVENT_CREATOR, CLOSE_EVENT_CREATOR, ADD_EVENT, DELETE_EVENT, CHANGE_VIEW, NEXT, PREV, TODAY, ADD_DEVICES } from "../actions/scheduleactions";

var currentClock = new Date(Date.now());
console.log(currentClock)
var initialState = {
    devices: [],
    events: [],
    view: "month",
    timezone: "EST",
    eventCreatorOpen: false,
    clock: currentClock,
    month: currentClock.getMonth() 
}


const reducer = (state = initialState, action)=>{
    switch(action.type){
        case TO_NEXT_MONTH:
            var month;
            var clock = state.clock;
            clock.setDate(1);
            if(state.month == 11){
                month = 0
                var year = clock.getFullYear()+1;
                clock.setFullYear(year);
            }else{
                month = state.month+1
            }
            
            clock.setMonth(month);
            if(clock.getMonth() == new Date(Date.now()).getMonth()){
                clock.setDate(new Date(Date.now()).getDate())
            }
            console.log(state.month);
            console.log(month);
            console.log(clock)
            return {
                ...state,
                month: month,
                clock: clock
            }
        case TO_PREVIOUS_MONTH:
            var month;
            var year;
            var clock = state.clock;
            if(state.month == 0){
                month = 11
                year = state.clock.getFullYear()-1
                clock.setFullYear(year);
            }else{
                month = state.month-1
            }
            clock.setMonth(month);
            if(clock.getMonth() == new Date(Date.now()).getMonth()){
                clock.setDate(new Date(Date.now()).getDate())
            }else{
                clock.setDate(1)
            }
            return {
                ...state,
                month: month,
                clock: clock
            }
        case OPEN_EVENT_CREATOR:
            return {
                ...state,
                eventCreatorOpen: action.payload
            }
        case CLOSE_EVENT_CREATOR:
            return {
                ...state,
                eventCreatorOpen: action.payload
            }
        case ADD_EVENT:
        var events = state.events
        events.push(action.payload.event);
            return {
                ...state,
                events: events,
                eventCreatorOpen: action.payload.eventCreatorOpen
            }
        case DELETE_EVENT:
            var events = state.events;
            var eventsFiltered = events.filter(event => {
                return event.name != action.payload.name
            });

            return{
                ...state,
                events: eventsFiltered
            }
        case CHANGE_VIEW: 
            return {
                ...state,
                clock: new Date(Date.now()),
                view: action.payload
            }
        

        case NEXT: 
            var month;
            var clock = state.clock;
            if(state.view == "month"){
                clock.setDate(1)
                clock.setMonth(clock.getMonth()+1);
            }
            else if(state.view == "week"){
                var date = clock.getDate();
                console.log(date);
                clock.setDate(date+7);
                console.log(clock)
            }
            else if(state.view == "day"){
                clock.setDate(clock.getDate()+1);
            }
            month = clock.getMonth();
            console.log(clock)
            return {
                ...state,
                clock: clock,
                month: month
            }

        case PREV:
            var month;
            var clock = state.clock;
            if(state.view == "month"){
                clock.setDate(1);
                clock.setMonth(clock.getMonth()-1);
            }
            else if(state.view == "week"){
                var date = clock.getDate();
                console.log(date);
                clock.setDate(clock.getDate()-7);
            }
            else if(state.view == "day"){
                clock.setDate(clock.getDate()-1);
            }
            month = clock.getMonth();
            console.log(clock)
            return{
                ...state,
                clock: clock,
                month: month
            }
        case TODAY:

        var clock = state.clock;
        clock.setTime(Date.now());
        console.log(clock)
            return{
                ...state,
                clock: clock,
                month: clock.getMonth()
            }
        case ADD_DEVICES: 
            return {
                ...state,
                devices: action.payload
            }
        default:
            return {...state};
    }
}

export default reducer;
