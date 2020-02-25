async function getFile(filename="Project.dc", telnetsocket, params, socket, instance=null){
    var command = `<IBackup><GetFile><call>Backup/${filename}</call></GetFile></IBackup>`;
    telnetsocket.connect(params);
    telnetsocket.on("error", (err)=>{
    })
    
    telnetsocket.on("connect", ()=>{
        telnetsocket.send(command, async (err, res)=>{
            if(err){
            }
            else{
                if(!res.includes("</IBackup>") && params.sendTimeout <= 120000){
                    let params = {...params, sendTimeout: params.sendTimeout*2}
                    await getFile(filename, telnetsocket, params, socket, instance);
                }else{
                    var dcFile64 = res.replace("<IBackup>", "").replace("<GetFile>", "").replace("<return>", "").replace("<Result>true</Result>", "").replace("<?File Encode=\"Base64\" /", "").replace(">", "").replace("</return>", "").replace("</GetFile>", "").replace("</IBackup>", "");
                    let Base64 = require("js-base64").Base64
                    let buff = Base64.decode(dcFile64);
                    let file = await buff.toString();
                    socket.emit("file-downloaded", file, instance);
                }
            }
        })
    })
}



module.exports = {
    getFile: getFile
}