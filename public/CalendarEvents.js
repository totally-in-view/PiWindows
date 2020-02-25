async function waitForEvent(date, event){
    while(Date.now() <= date){
        setTimeout(()=>{

        }, 1000);
    }

    event.call();
}

module.exports.waitForEvent = waitForEvent