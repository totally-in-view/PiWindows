import React, { Component } from 'react';
import Instance from "./components/Instance";
import ThreadManager from "./components/ThreadManager";
import AddDriver from "./components/AddDriver";
import DriverDesigner from "./components/DriverDesigner";
import Dashboard from "./components/Dashboard";
import Diagnostics from "./components/Terminal";
import Settings from "./components/Settings";
import Logs from "./components/Diagnostics";
import LoadScreen from "./components/LoadScreen";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Version from "./components/Version";
import io from "../node_modules/socket.io-client"
import toaster from "toasted-notes"
import './App.css';
import './assets/css/style-dark.css';
import './assets/css/font-awesome.min.css';
import '../node_modules/toasted-notes/src/styles.css';
//REDUX
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {toScreen,getAreas, getDeviceTypes, addInstance, getFile, addDriver, addDevice, updateSidebar, addEventToFile, changePermissions, getManifest, updateLog, getDeviceMap, isLoading, updateSocket, updateDeviceCount, updateInstanceCount, addUserId, updateProgress} from "./store/actions/index";

//React Router
import {BrowserRouter, Redirect, Route} from "react-router-dom";

class App extends Component {
  constructor(props){
    super(props)
  }
  
    componentDidMount(){
    window.onbeforeunload = (e)=>{
      this.props.app.socket.emit("close");
      this.props.app.socket.close();
    };

    //line eletron.js line 1998 event gets emit
    this.props.app.socket.emit("file-request");
    this.props.app.socket.emit("get-drivers");
    this.props.app.socket.emit("get-device-statuses");
    this.props.app.socket.emit("start-log");

    this.props.app.socket.on("connect_timeout", (timeout)=>{
      this.props.updateSocket(io("http://localhost:3031", { timeout: 360000 }))
    })
    this.props.app.socket.emit("map-request")
    this.props.app.socket.on("db", (db)=>{

    })
    this.props.app.socket.on("driversReturned", (drivers)=>{
      this.props.getManifest(drivers);
    });

    this.props.app.socket.on("file-requested", (file)=>{
      console.log(file);
      this.props.getFile({...file, devices: []});
    })

    this.props.app.socket.on("file-updated", (file)=>{
      this.props.getFile(file);
    })
    this.props.app.socket.on("update-log", (data)=>{

    });
    this.props.app.socket.on("inspection", (data)=>{
      let parser = new DOMParser();
      let inspection = {
        mac: "",
        localaddress: "",
        subnetmask: "",
        broadcast: "",
        defaultgateway: "",
        dns: "",
        masternumber: "",
        serialnumber: "",
        model: "",
        enabled: "",
        isbacnet: "",
        channel: "",
        firmware: ""
      };
      let peers = [];
      let file = this.props.app.file;
      if(data.inspection.status == null){
        for(var prop in data.inspection){
          if(prop != "id"){
            let doc = parser.parseFromString(data.inspection[prop], "application/xml");
            if(prop == "ethernetInfo"){
              let info = doc.children[0].children[0].children[0].children;
              for(var i = 0; i < info.length; i++){
                let item = info[i]
                if(item.tagName.toLowerCase() == "ipaddress"){
                  inspection["localaddress"] = item.innerHTML
                }else{
                  inspection[item.tagName.toLowerCase()] = item.innerHTML
                }
              };
            }
            else if(prop == "systemInfo"){
              let sysInfo = doc.children[0].children[0].children[0].children[0].children;

              for(var i = 0; i < sysInfo.length; i++){
                let item = sysInfo[i];

                if(item.tagName.toLowerCase() == "masternumber" || item.tagName.toLowerCase() == "serialnumber" || item.tagName.toLowerCase() == "model" || item.tagName.toLowerCase() == "isbacnet" ){
                  inspection[item.tagName.toLowerCase()] = item.innerHTML;
                }
                if(item.tagName.toLowerCase() == "peers"){
                  for(var j = 0; j < item.children.length; j++){
                    peers.push(item.children[j].innerHTML);
                  }
                }
                if(item.tagName.toLowerCase() == "counts"){
                  if(item.children[0].innerHTML == "1"){
                    inspection["enabled"] = "false"
                  }else{
                    inspection["enabled"] = "true"
                  }
                }
              }
            }
            else if(prop == "channel"){
              let item = doc.children[0].children[0].children[0].innerHTML;
              inspection["channel"] = item;
            }
            else if(prop == "versionRes"){
              let versionInfo = doc.children[0].children[0].children[0].children;
              for(var i = 0; i < versionInfo.length; i++){
                let item = versionInfo[i];
                if(item.tagName == "app"){
                  inspection["firmware"] = item.innerHTML
                }
              }
            }
          }
        }
        const index = file.instances.findIndex((instance)=>{
          return instance.id == data.inspection.id
        })
        try{
          if(file.instances[index]["inspection"] == null){
            file.instances[index]["inspection"] = [];
          }else{
            let instanceIndex = file.instances[index]["inspection"].findIndex((value)=>{
              return value.serialnumber == inspection.serialnumber
            })
            if(instanceIndex != -1){
              file.instances[index]["inspection"][instanceIndex] = inspection;
            }else{
              file.instances[index]["inspection"].push(inspection);
            }
          }
          if(file.instances[index]["inspection"] == null){
            file.instances[index]["inspection"] = [];
          }else{
            let instanceIndex = file.instances[index]["inspection"].findIndex((value)=>{
              return value.serialnumber == inspection.serialnumber
            })
            if(instanceIndex != -1){
              file.instances[index]["inspection"][instanceIndex] = inspection;
            }else{
              file.instances[index]["inspection"].push(inspection);
            }
          }

          file.instances[index]["inspection"] = file.instances[index]["inspection"].sort((a, b) =>{
            return a.masternumber - b.masternumber
          })
          for(var i = 0; i < peers.length; i++){
            let masterIndex = file.instances[index]["inspection"].findIndex((value)=>{
              return value.masternumber == peers[i]
            });

            if(masterIndex == -1){
              this.props.app.socket.emit("inspect-instance", file.instances[index], peers[i])
            }
          }
        }catch(err){

        }

      }else{

        const index = file.instances.findIndex((instance)=>{
          return instance.id == data.inspection.id
        })
        file.instances[index].inspection = {status: "offline"};
      }



        this.props.app.socket.emit("instances-inspected", file);
    });

    this.props.app.socket.on("map-response", (map)=>{
      this.props.getDeviceMap(map);
    })

    this.props.app.socket.on("device-statuses-update", (statuses)=>{
      this.props.updateDeviceCount(statuses);
    })

    this.props.app.socket.on("decipher-buses", (data)=>{
      let parser = new DOMParser();
      let busDoc = parser.parseFromString(data.buses, "application/xml");
      let busObjs = busDoc.getElementsByTagName("Bus");
      let busArr = [];

      for(let i = 0; i < busObjs.length; i++){
        let bus = busObjs[i];

        let busId = bus.getElementsByTagName("Bus")[0].innerHTML;
        let locked = bus.getElementsByTagName("Locked")[0].innerHTML;
        let online = bus.getElementsByTagName("Online")[0].innerHTML;
        let type = bus.getElementsByTagName("Type")[0].innerHTML;
        busArr.push({
          id: busId,
          locked: locked,
          online: online,
          type: type,
          instanceId: data.instance.id
        });
      }

      this.props.app.socket.emit("buses-deciphered", busArr);
    });
    this.props.app.socket.on("reconnect", (attemptNumber)=>{
      console.log(attemptNumber)
    })
    this.props.app.socket.on("instance-status", (data)=>{
      let {instance, status} = data;
      let {online, offline} = this.props.app.instanceStatusCount
      let onlineIndex = online.findIndex(onlineInstance=>{
        return onlineInstance.id == instance.id
      });

      let offlineIndex = offline.findIndex(offlineInstance=>{
        return offlineInstance.id == instance.id
      })
      if(status == "online"){

        if( onlineIndex< 0){
          online.push(instance);
        }
        if(offlineIndex > -1){
          offline = offline.filter(id =>{
              return id != instance
          });
          }
        }else if(status == "offline"){
          if(offlineIndex < 0){
                offline.push(instance);
            }
            if(onlineIndex > -1){
                online = online.filter(id =>{
                    return id != instance
                });
            }
          }
          this.props.updateInstanceCount({online: online, offline: offline});

    })

    this.props.app.socket.on("to-register-page", ()=>{
      this.props.toScreen(<Redirect to="/register" exact/>)
    })

    this.props.app.socket.on("to-login-page", ()=>{
      this.props.toScreen(<Redirect to="/login"/>);
    })
    this.props.app.socket.on("login-success", (user)=>{
      this.props.app.socket.emit("diagnostic-daily-job-req", user.clientId);
      this.props.addUserId(user.clientId)
      this.props.changePermissions(user.permission);
      this.props.toScreen(<Redirect to="/" exact/>)

    })
//toast
    this.props.app.socket.on("notify-event", (event)=>{
      toaster.notify(event, {
        position: "top-right"
      })
    })

    this.props.app.socket.on("job", (time, job)=>{
      console.log("Job Info");
    })

    this.props.app.socket.on("update-progress", (instance, level, totalProgress)=>{
      this.props.updateProgress(instance, level, totalProgress);
    })
    this.props.app.socket.on("disconnect", ()=>{
    })

    this.props.app.socket.on("to-version", ()=>{
      console.log("Changing Screen")
      this.props.toScreen(<Redirect to="/version"/>)
    })

    this.props.app.socket.on("to-thread-manager", ()=>{
      this.props.toScreen(<Redirect to="/thread-manager"/>);
    })
  }

  componentDidUpdate(){
  }
  async getFile(){
    this.props.app.socket.emit("get-file", {data: this.state.IPAddress});
  }

  async to(screen, params=null){
    var state = this.props.app
    if(screen == "Login"){
      this.props.toScreen(<Redirect to="/login"/>)
    }else if(screen == "Register"){
      this.props.toScreen(<Redirect to="/register"/>);
    }
    else if(screen == "Forget Password"){
      this.props.toScreen(<Redirect to="/forget-password" />);
    }
    else if(screen == "Dashboard"){
      this.props.toScreen(<Redirect to="/" exact/>);
    }
    else if(screen == "Add Device"){
      this.props.toScreen(<Redirect to="/add-device"/>)
    }
    else if(screen == "Template Editor"){
      this.props.toScreen(<Redirect to="/template-editor" />);
    }
    else if(screen == "Logs"){
      this.props.toScreen(<Redirect to="/logs" />);
    }
    else if(screen == "Driver Designer"){
      this.props.toScreen(<Redirect to="/driver-designer"/>);
    }
    else if(screen == "Add Instance"){
      this.props.toScreen(<Redirect to="/add-instance"/>)
    }
    else if(screen == "Settings"){
      this.props.toScreen(<Redirect to="/settings"/>)
    }
    else if(screen == "Schedules"){
      this.props.toScreen(<Redirect to="/schedules" />);
    }
    else if(screen == "Diagnostics"){
      this.props.toScreen(<Redirect to="/diagnostics"/>)
    }
    else if(screen == "Mass Upload"){
      this.props.toScreen(<Redirect to="/mass-upload"/>);
    }
    else if(state.file.instances.findIndex(instance => instance.name === screen) >= 0){
      var instance = state.file.instances.find(instance => instance.name === screen);
      if(params != null){
        console.log(params)
        this.props.toScreen(<Redirect to={`/instances/${instance.id}?area=${params.area}`}/>);
      }else{
        this.props.toScreen(<Redirect to={`/instances/${instance.id}`} />)
      }

    }
    else if(screen.redirect == true){
      this.props.toScreen(screen.view);
    }
    else if(screen.filter != null){
      var instance = state.file.instances.find(instance => instance.name === screen.screen);
      let filter = `?area=${screen.filter.area}`
      let path = `instances/${instance.id}`
      if(screen.filter.deviceType != null){
        filter =`${filter}&deviceType=${screen.filter.deviceType}`
      }
      if(screen.alias != null){
        path = `${path}/${screen.alias}`
      }
      this.props.toScreen(<Redirect to={{
        pathname: path,
        search: filter
      }} />);
    }
    else{
      var instance = state.file.instances.find(instance=> {return instance.aliases.indexOf(screen) > -1});
      this.props.toScreen(<Redirect to={`/instances/${instance.id}/${screen}`}/>)
    }

  }

  isLoading(loadBool){
    this.props.isLoading(loadBool)
  }
  addInstance(instance){
    this.props.addInstance(instance)
  }

  addDevice(device){
    this.props.addDevice(device);
  }

  addEventToFile(event){
    this.props.addEventToFile(event);
  }
  validate(pass){
    this.props.changePermissions(pass)
  }

  updateFile(file){
    this.props.getFile(file);
  }
  render(){
    let adminBar =  <div className="admin-bar">
                        <div onClick={()=>{
                          this.props.changePermissions("admin")
                        }}>Admin View</div>
                        <div onClick={()=>{
                          this.props.changePermissions("analytics")
                        }}>Analytics View</div>
                        <div onClick={()=>{
                          this.props.changePermissions("client")
                        }}>Client View</div>
                    </div>;
    let state = this.props.app
    let instanceRoutes = [];
    let loadview;
    let driverDesigner = null
    let instanceOnlineBubble = state.instanceStatusCount.online.length > 0 ? <span className="online-bubble">{state.instanceStatusCount.online.length}</span> : null;
    let instanceOfflineBubble = state.instanceStatusCount.offline.length > 0 ? <span className="offline-bubble">{state.instanceStatusCount.offline.length}</span> : null;
    let deviceOnlineBubble = state.deviceStatusCount.online.length > 0 ?<span className="online-bubble">{state.deviceStatusCount.online.length}</span> : null;
    let deviceOfflineBubble = state.deviceStatusCount.offline.length > 0 ? <span className="offline-bubble">{state.deviceStatusCount.offline.length}</span> : null;

    if(state.file.instances.length > 0){
      state.file.instances.forEach((instance)=>{
        if(instance.aliases.length > 0){
          instance.aliases.forEach((alias)=>{
            instanceRoutes.push(<Route path={`/instances/${instance.id}/${alias}`} render={(props)=>{return (<Instance socket={this.props.app.socket} name={instance.name} id={instance.id} alias={alias} location={props.location} permissions={state.permissions}exact/>)}}/>)
          });
        }else{
          instanceRoutes.push(<Route path={`/instances/${instance.id}`} render={(props)=>{return (<Instance socket={this.props.app.socket} name={instance.name} id={instance.id} location={props.location} permissions={state.permissions}/>)}}/>)
        }
      })
    }
    if(state.permissions == "admin"){
        driverDesigner = <span onClick={this.to.bind(this, "Driver Designer")} className="fa fa-magic nav-icon"></span>

    }
    if(state.loading == true){
      loadview = <LoadScreen />
    }



    return (
      <BrowserRouter>

      <div className="wrapper theme-4-active pimary-color-red">
      {
       ((permissions, progress)=>{
        let progressHTML = null
        if(progress != null){
          if(progress.level == progress.totalProgress){
            progressHTML = null;
          }else{
            progressHTML = <progress max={progress.totalProgress} data-label={`${progress.instance.name} - ${Math.round((progress.level / progress.totalProgress) * 100)}%`} value={progress.level}></progress>
          }
         }
          if(permissions == "admin"){
            return <nav className="navbar navbar-inverse navbar-fixed-top" style={{display: "flex", flexFlow: "column", justifyContent: "space-between", alignItems: "center", paddingRight: "0px"}}>
                    {adminBar}
                    <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center", width: "60%"}}>
                        <div style={{color:"#fff", textTransform: "capitalize", fontSize: "30px", width: "500px", display: "flex", flexFlow: "row nowrap", justifyContent: "space-around", alignItems: "center"}}>
                          <div>Pi {permissions}</div>
                          {progressHTML}
                        </div>
                        <div className="pi-navbar-item">Instances{instanceOnlineBubble}{instanceOfflineBubble}</div>
                        <div className="pi-navbar-item">Devices{deviceOnlineBubble}{deviceOfflineBubble}</div>
                      </div>
                      <div style={{marginLeft: "auto"}}>
                      <div style={{display: "flex", flexFlow: "row", alignItems: "center"}}>
                        <span onClick={this.to.bind(this, "Dashboard")} className="fa fa-home nav-icon"></span>
                        <span onClick={this.to.bind(this, "Logs")} className="fa fa-table nav-icon"></span>
                        <span onClick={this.to.bind(this, "Diagnostics")} className="fa fa-wrench nav-icon"></span>
                        {driverDesigner}
                        <span onClick={this.to.bind(this, "Settings")} className="fa fa-cogs nav-icon"></span>
                      </div>
                      </div>
                      </div>
                    </nav>
          }else if(permissions == "client" || permissions== "analytics"){
            return <nav className="navbar navbar-inverse navbar-fixed-top" style={{display: "flex", flexFlow: "column", justifyContent: "space-between", alignItems: "center", paddingRight: "0px"}}>
            <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{display: "flex", flexFlow: "row", justifyContent: "space-between", alignItems: "center", width: "60%"}}>
                <div style={{color:"#fff", textTransform: "capitalize", fontSize: "30px", width: "500px", display: "flex", flexFlow: "row nowrap", justifyContent: "space-around", alignItems: "center"}}>
                    <div>Pi {permissions}</div>
                      {progressHTML}
                </div>
                <div className="pi-navbar-item">Instances{instanceOnlineBubble}{instanceOfflineBubble}</div>
                <div className="pi-navbar-item">Devices{deviceOnlineBubble}{deviceOfflineBubble}</div>
              </div>
              <div style={{marginLeft: "auto"}}>
              <div style={{display: "flex", flexFlow: "row", alignItems: "center"}}>
                <span onClick={this.to.bind(this, "Dashboard")} className="fa fa-home nav-icon"></span>
                <span onClick={this.to.bind(this, "Logs")} className="fa fa-table nav-icon"></span>
                <span onClick={this.to.bind(this, "Diagnostics")} className="fa fa-wrench nav-icon"></span>
                <span onClick={this.to.bind(this, "Settings")} className="fa fa-cogs nav-icon"></span>
              </div>
              </div>
              </div>
            </nav>
          }else{
            return null;
          }
       })(state.permissions, state.progress)
      }

       <div className="page-wrapper" style={{minHeight: "368px", marginLeft: "0px"}}>
          <div className="container-fluid">
            { loadview }
            { state.screen }
            <Route path="/" render={(props) => {
              return <Dashboard socket={this.props.app.socket} to={this.to.bind(this)} file={state.file} deviceHealth={state.deviceStatusCount} instancesStatuses={state.instanceStatusCount}/>
            }} exact/>
            <Route path="/Driver-Designer" render={ (props)=>{return (<DriverDesigner socket={this.props.app.socket}/>)}}/>
            <Route path="/diagnostics" render={(props)=>{return (<Diagnostics socket={this.props.app.socket} instances={state.file.instances} isLoading={this.isLoading.bind(this)} permissions={state.permissions}/>)}} />
            <Route path="/settings" render={(props)=>{return(<Settings socket={this.props.app.socket} validatePrivileges={this.validate.bind(this)} file={state.file} permissions={state.permissions} update={this.updateFile.bind(this)} drivers={state.drivers} map={state.deviceMap}/>)}}/>
            <Route path="/logs" render={(props)=>{ return(<Logs instances = {state.file.instances} socket={this.props.app.socket}/>)}}/>
            <Route path="/register" render={(props)=>{
               return <Register to={this.to.bind(this)} socket={this.props.app.socket}  permissions={state.permissions} />
            }}/>
            <Route path="/login" render={(props)=>{
              return <Login to={this.to.bind(this)} socket={this.props.app.socket} />
            }}/>
            <Route path="/forget-password" render={(props)=>{
              return <ForgotPassword to={this.to.bind(this)} socket={this.props.app.socket} />
            }} />

            <Route path="/version" render={(props)=>{
              return <Version socket={this.props.app.socket} />
            }} />

            <Route path="/thread-manager" render={(props)=>{
              return <ThreadManager socket={this.props.app.socket} />
            }} />
            {instanceRoutes}
        </div>
        <footer className="footer container-fluid pl-30 pr-30" style={{position:"relative"}}>
					<div className="row">
						<div className="col-sm-12">
							<p style={{color:"#fff", fontSize: "10px", lineHeight: "12px"}}>PI&trade;<br/>
 This software, including all functionality, graphics and user interfaces, is proprietary and owned or exclusively licensed by Totally In View, Inc. The PI&trade; mark is either a trademark or registered trademark owned or exclusively licensed by Totally In View, Inc. © Copyright 2019, all rights reserved. Proprietary information is contained within this demonstration and confidentiality is required in order to access this presentation and the information contained herein. Access is provided for demonstration only.</p>
						</div>
					</div>
				</footer>
      </div>
      </div>
      </BrowserRouter>
    );
  }
}


App.defaultProps = {
  file: {
      devices: [
      ],
      instances: [
      ]
  }
}

const mapDispatchToProps = dispatch=>{
  return bindActionCreators({
    toScreen: toScreen,
    getAreas: getAreas,
    getDeviceTypes: getDeviceTypes,
    addInstance: addInstance,
    getFile: getFile,
    addDriver: addDriver,
    addDevice: addDevice,
    addEventToFile: addEventToFile,
    updateSidebar: updateSidebar,
    getManifest: getManifest,
    changePermissions: changePermissions,
    updateLog: updateLog,
    getDeviceMap: getDeviceMap,
    isLoading: isLoading,
    updateSocket: updateSocket,
    updateDeviceCount: updateDeviceCount,
    updateInstanceCount: updateInstanceCount,
    addUserId: addUserId,
    updateProgress: updateProgress
  }, dispatch);
};

const mapStateToProps =  state =>{
  return {
    app: state.app
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(App);
