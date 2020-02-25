let Instance = require("./Instance");
let net = require("net");
class Vantage extends Instance { 
    constructor(props){
        super(props);

        this.hostPort = 3001;
        this.advancedPort = 2001;
        this.hostSocket = null;
        this.advancedSocket = null;
    }

    write(data){

    }

    connect(){
        this.hostSocket = net.createConnection(parseInt(this.hostPort), this.address);
        this.advancedSocket = net.createConnection(parseInt(this.advancedPort), )
    }
}