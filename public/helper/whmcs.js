let request = require("request-promise-native");
async function registerUser(info){
    let user;
    await request({
        method: "POST",
        uri: "http://portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
        form: {command: "AddClient", registrationInfo: JSON.stringify(info)}
    }, (err, res, body)=>{
        if(err){
            user = {err};
        }else{
            let response = JSON.parse(body);
            if(response.result == "success"){
                user = {
                    clientId: response.clientid,
                    firstname: info.firstname,
                    lastname: info.lastname,
                    permission: "client"
                }
            }else{
                user = {err: response.message};
            }
        }
    })
    console.log(user);
    return user;
}

async function login(info){
    let user = {}
    let res = await request({
        method: "POST",
        uri: "http://www.portal.pinnacleintegrationsoftware.com/includes/pi_api.php",
        form: {command: "ValidateLogin", client: JSON.stringify(info)}
    }, (err, res, body)=>{
        let user = {}
        if(err){
            console.log(err);
            user = {err}
        }else{
            
            if(body != undefined){
                let response = JSON.parse(body);
                if(response.result == "success"){
                    user = {clientId: response.userid}
                }else{
                    user =  {err: response.message};
                }
            }
        }

        return user;
    });
    let response =JSON.parse(res);
    if(response.result == "success"){
        console.log(res);
        return user = {clientId: response.userid, permission: "client"}
    }else{
        return user = {err: response};
    }
}

module.exports = {
    registerUser,
    login
}