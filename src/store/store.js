import {createStore, applyMiddleware, combineReducers} from "redux";
import wizardReducer from "./reducers/driverwizard";
import appReducer from "./reducers/root";
import sidebarReducer from "./reducers/sidebar";
import objectReducer from "./reducers/object";
import {reducer as objectViewReducer} from "./reducers/objectview";
import instanceReducer from "./reducers/instance";
import deviceEditorReducer from "./reducers/deviceeditor";
import schedulesReducer from "./reducers/schedules";
const rootreducer = combineReducers({
    wizard: wizardReducer,
    app: appReducer,
    sidebar: sidebarReducer,
    object: objectReducer,
    objectView: objectViewReducer,
    instance: instanceReducer,
    deviceEditor: deviceEditorReducer,
    schedules: schedulesReducer
});


const store = createStore(rootreducer);


export default store;