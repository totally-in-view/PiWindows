import { FIRST_STEP, SECOND_STEP, THIRD_STEP, GET_PARENT_DRIVERS } from "./wizardactions"


const firstStep = (wizard, view) =>{
    return {
        type: FIRST_STEP,
        payload: {
            wizard: {first: "active", second: "disabled", third: "disabled", step: 1},
            driver: {...wizard.driver},
            view: {...view}
        }
    }
}

const secondStep = (wizard, view) =>{
    return {
        type: SECOND_STEP,
        payload: {
            wizard: {first: "disabled", second: "active", third: "disabled", step: 2},
            driver: {...wizard.driver},
            functionCreatorOpen: wizard.functionCreatorOpen,
            functionOpened: wizard.functionOpened,
            view: {...view}
        }
    }
}

const thirdStep = (wizard, view) =>{
    return {
        
        type: THIRD_STEP,
        payload: {
            wizard: {first: "disabled", second: "disabled", third: "active", step: 3},
            driver: {...wizard.driver},
            view: {...view}
        }
    }
}

export const getParentDrivers = (drivers)=>{
    return {
        type: GET_PARENT_DRIVERS,
        payload: [...drivers]
    }
}

export const step = (step, wizard, view)=>{
    switch(step){
        case 2: 
            return secondStep(wizard, view);
        case 3: 
            return thirdStep(wizard, view);
        default:
            return firstStep(wizard, view);
    }
}