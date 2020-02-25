let {Application} = require("spectron");
let path = require("path")
function initializeSpectron(){
    let electron = path.join(__dirname, "..", "dist", "win-unpacked", "pi.exe");

    let electronPath = path.join(__dirname, "..");
    
    return new Application({
        path: electron,
        env: {
            ELECTRON_ENABLE_LOGGING: true,
            ELECTRON_ENABLE_STACK_DUMPING: true,
            NODE_ENV: "development"
        },
        startTimeout: 50000
    });
}


module.exports = initializeSpectron