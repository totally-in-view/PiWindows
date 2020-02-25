let chai = require("chai");
let Vantage = require("../public/Vantage");
let Telnet = require("telnet-client");
describe("vantage-tests", function(){
    this.enableTimeouts(false)

    it("should-download-file", function(){
        let socket = new Telnet();
        let file = Vantage.getFile("Project.dc", )
        return
    })
})