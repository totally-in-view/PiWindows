/**
 * @function DriverFactory
 * @param {object} driver 
 * @desc Takes a PI Driver and Creates Runtime Operational Device.
 * @returns {object}
 */
function DriverFactory(driver){
    driver.functions.forEach((funct)=>{
        var temporaryFunction = new Function(funct.params, funct.body);

        driver[funct.name] = temporaryFunction.bind(driver);
    })

    return driver;
}

module.exports.DriverFactory = DriverFactory;