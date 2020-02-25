import React from "react";
import Panel from "./Panel";
import {Index} from "./client/widgets/index";
export default class ThreadManager extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            threads: []
        }
    }
    
    componentDidMount(){
        this.props.socket.emit("get-thread-manager")
        this.props.socket.on("thread-manager-returned", (threadmanager)=>{
            this.setState({
                threads: threadmanager
            })
        })
    }

    refresh(pid){
        this.props.socket.emit("refresh-thread", pid);
    }
    render(){
        return (<Panel header={"Pi Services"} body={<div>{
            <div style={{display: "flex", flexFlow: "row"}}>{this.state.threads.map((thread)=>{                
                if(Array.isArray(thread.instances)){
                    let title = "";
                    for(let instance of thread.instances){
                        if(instance != null){
                            title += `${instance.name}, `
                        }
                    }
                    if(title.length > 0){
                        title = title.substring(0, title.length-2);
                    }
                    return <div className="pi-card md">
                            <div style={{cursor: "pointer"}} className="pi-card-title">Process {thread.pid}: Instances {title} <div><i className="fa fa-refresh" style={{cursor: "pointer", color: "#fff", paddingLeft: "5px"}} onClick={this.refresh.bind(this, thread.pid)}></i></div></div>
                            <div style={{display: "flex", flexFlow: "column", width: "100%", alignItems: "center"}}>
                            <div style={{color: "ivory"}}>Heap Usage</div>
                                <Index.HeapDonut heapUsed={thread.mem.usedHeapSize} heapTotal={thread.mem.totalHeapSize} />
                            </div>
                        </div>
                }
                return  <div className="pi-card md">
                            <div style={{cursor: "pointer", alignItems: "flex-start"}} className="pi-card-title">Process {thread.pid}: {thread.instances[0].toUpperCase() + thread.instances.slice(1)} <div><i className="fa fa-refresh" style={{cursor: "pointer", color: "#fff", paddingLeft: "5px"}} onClick={this.refresh.bind(this, thread.pid)}></i></div></div>
                            <div style={{display: "flex", flexFlow: "column", width: "100%", alignItems: "center"}}>
                                <div style={{color: "ivory"}}>Heap Usage</div>
                                <Index.HeapDonut heapUsed={thread.mem.usedHeapSize} heapTotal={thread.mem.totalHeapSize} />
                            </div>
                        </div>
            })}</div>
        }</div>}/>)
    }
}