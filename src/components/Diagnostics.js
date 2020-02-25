import React from "react";
import Panel from "./Panel"
import MultiSelect from "./MultiSelect";
export default class Diagnostics extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            currentPage: 1,
            logEntries: [],
            numberOfEntries: 0,
            searchBy: "Log",
            searchTerm: "",
            dropdownClass: "toggle-dropdown-hidden",
            dropdownClassLeft: "toggle-dropdown-hidden"
        }

        this.showDropdown = this.showDropdown.bind(this);
        this.hideDropdown = this.hideDropdown.bind(this)
    }
    
    componentDidMount(){
        this.props.socket.emit("diagnostics-request", 1);
        this.props.socket.on("diagnostics-response", (data)=>{
            let {logs, numberOfEntries} = data;
            this.setState({
                logEntries: logs,
                numberOfEntries: numberOfEntries,
            })
        })
    }


    shouldComponentUpdate(nextProps, nextState){
        return this.state.logEntries !== nextState.logEntries || this.state.dropdownClass !== nextState.dropdownClass || this.state.dropdownClassLeft !== nextState.dropdownClassLeft || this.state.searchBy !== nextState.searchBy
    }
    toFirstPage(){
        this.props.socket.emit("diagnostics-request", 1);
        this.setState({
            currentPage: 1
        })
    }

    toLastPage(){
        this.props.socket.emit("diagnostics-request", Math.ceil(this.state.numberOfEntries/50));
        this.setState((prevState, props)=>({
            currentPage: Math.ceil(prevState.numberOfEntries/50)
        }))
    }
    nextPage(){
        var nextPage =this.state.currentPage+1;
        if(Math.ceil(this.state.numberOfEntries/50) >= nextPage){
            this.props.socket.emit("diagnostics-request", nextPage);
            this.setState((prevState, props)=>({
                currentPage: nextPage
            }))
        }
    }

    previousPage(){
        var previousPage = this.state.currentPage-1;
        if(previousPage > 0){
            this.props.socket.emit("diagnostics-request", previousPage);
            this.setState(({
                currentPage: previousPage
            }))
        }
    }

    toCertainPage(pageNumber){
        this.props.socket.emit("diagnostics-request", parseInt(pageNumber));
        this.setState({
            currentPage: pageNumber
        })
    }

    sortBy(option){
        console.log(option)
        var logs = this.state.logEntries;
        var sortedLog = [];
        switch(option){
            case "Instance":
                sortedLog = logs.sort((a, b, option)=>{
                    if(a.instanceName > b.instanceName){
                        return -1;
                    }else if(a.instanceName < b.instanceName){
                        return 1;
                    }
                    return 0;
                });
                break;
            case "Event Time":
                sortedLog = logs.sort((a, b)=>{
                    if(a.eventTime > b.eventTime){
                        return -1;
                    }else if(a.eventTime < b.eventTime){
                        return 1;
                    }
                    return 0;
                })
                break;
            default:
                sortedLog = logs;
                break
    }

        this.setState({
            logEntries: sortedLog
        });
    }
    searchDiagnostics(event){
        let value = event.target.value;
        this.props.socket.emit("filter-log", value, this.state.searchBy)
        
    }

    searchBy(search){
        this.setState({
            searchBy: search
        })
    }

    getPagination(){
        let pagination = [];
        pagination.push(<li onClick={this.toFirstPage.bind(this)}><a>{"<<"}</a></li>)
        pagination.push(<li onClick={this.previousPage.bind(this)}><a>{"<"}</a></li>);
        pagination.push(<li><a>{"..."}</a></li>);

        let totalPages = Math.ceil(this.state.numberOfEntries/50);
        if(totalPages < 25){
            for(let i = 0; i < totalPages; i++){
                if(i === this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }    
        }else{
            let upperLimit = totalPages >  this.state.currentPage+12 ? this.state.currentPage+12 : totalPages;
            let lowerLimit = this.state.currentPage < 12 ? 0 : this.state.currentPage-12

            if(upperLimit + lowerLimit < 24){
                upperLimit += 24 - (upperLimit-lowerLimit)
            }
            for(var i = lowerLimit; i < upperLimit; i++ ){
                if(i === this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else if(i < 0){
   
                }
                else if(i > totalPages){

                }
                else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }

        }
        pagination.push(<li><a>{"..."}</a></li>);
        pagination.push(<li onClick={this.nextPage.bind(this)}><a>{">"}</a></li>)
        pagination.push(<li onClick={this.toLastPage.bind(this)}><a>{">>"}</a></li>)
        return pagination
    }

    showDropdown(isLeft){
        if(isLeft == true){
            this.setState({
                dropdownClassLeft: "toggle-dropdown-shown"
            })
        }else{
            this.setState({
                dropdownClass: "toggle-dropdown-shown"
            })
        }
        
    }

    hideDropdown(isLeft){
        if(isLeft == true){
            this.setState({
                dropdownClassLeft: "toggle-dropdown-hidden"
            })
        }else{
            this.setState({
                dropdownClass: "toggle-dropdown-hidden"
            })
        }
    }
    render(){
        var logUI = [];
        let pagination = [];
        pagination.push(<li onClick={this.toFirstPage.bind(this)}><a>{"<<"}</a></li>)
        pagination.push(<li onClick={this.previousPage.bind(this)}><a>{"<"}</a></li>);
        pagination.push(<li><a>{"..."}</a></li>);

        let totalPages = Math.ceil(this.state.numberOfEntries/50);
        if(totalPages < 25){
            for(let i = 0; i < totalPages; i++){
                if(i === this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }    
        }else{
            let upperLimit = totalPages >  this.state.currentPage+12 ? this.state.currentPage+12 : totalPages;
            let lowerLimit = this.state.currentPage < 12 ? 0 : this.state.currentPage-12

            if(upperLimit + lowerLimit < 24){
                upperLimit += 24 - (upperLimit-lowerLimit)
            }
            for(var i = lowerLimit; i < upperLimit; i++ ){
                if(i === this.state.currentPage-1){
                    pagination.push(<li className="page-active" onClick={this.toCertainPage.bind(this,i+1)}><a>{i+1}</a></li>)
                }else if(i < 0){
   
                }
                else if(i > totalPages){

                }
                else{
                    pagination.push(<li onClick={this.toCertainPage.bind(this, i+1)}><a>{i+1}</a></li>)
                }
            }

        }
        pagination.push(<li><a>{"..."}</a></li>);
        pagination.push(<li onClick={this.nextPage.bind(this)}><a>{">"}</a></li>)
        pagination.push(<li onClick={this.toLastPage.bind(this)}><a>{">>"}</a></li>)
        return(
            <Panel header = {"Logs"} body= {
                <div>
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="input-group mb-3" style={{display:"flex"}}>
                            <div className="input-group-prepend" onMouseOver={()=>this.showDropdown(true)} onMouseLeave={()=>this.hideDropdown(true)}>
                                <button style={{borderTopRightRadius: 0, borderBottomRightRadius: 0, width: "150%"}} className="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expaned="false">Sort By</button>
                                <div className={`toggle-dropdown-menu ${this.state.dropdownClassLeft}`}>
                                        <a className="toggle-dropdown-item" onClick={this.sortBy.bind(this, "Instance")}>Instance</a>
                                        <a className="toggle-dropdown-item" onClick={this.sortBy.bind(this, "Event Time")}>Event Time</a>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="input-group mb-3" style={{display: "flex"}}>
                                <div className="input-group-prepend" onMouseOver={this.showDropdown} onMouseLeave={this.hideDropdown}>
                                    <button style={{borderTopRightRadius: 0, borderBottomRightRadius: 0}} className="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" >Search By</button>
                                    <div className={`toggle-dropdown-menu ${this.state.dropdownClass}`}>
                                        <a className="toggle-dropdown-item" onClick={this.searchBy.bind(this, "Log")}>Log</a>
                                        <a className="toggle-dropdown-item" onClick={this.searchBy.bind(this, "Instance")}>Instance</a>
                                        <a className="toggle-dropdown-item" onClick={this.searchBy.bind(this, "Event Time: MM/DD/YYYY HH:MM:SS - MM/DD/YYYY HH:MM:SS")}>Event Time</a>
                                    </div>
                                </div>
                            
                                <input onChange={this.searchDiagnostics.bind(this)} placeHolder={this.state.searchBy}type="text" className="form-control filled-input"/>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-12">
                            <table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Log</th>
                                        <th>Instance</th>
                                        <th>Event Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.logEntries.map((log, index) =>{
                                        let date = new Date(log.eventTime);
                                        let minutes = `${date.getMinutes()}`;
                                        let hours = `${date.getHours()}`;
                                        let seconds = `${date.getSeconds()}`;
                                        if(minutes.length === 1){
                                            minutes = `0${minutes}`;
                                        }
                        
                                        if(hours.length === 1){
                                            hours = `0${hours}`
                                        }

                                        return <tr key={index+1}>
                                                <td>{log.log}</td>
                                                <td>{log.instanceName}</td>
                                                <td>{`${date.toDateString()} - ${hours}:${minutes}:${seconds}`}</td>
                                               </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-12" style={{display: "flex", flexFlow: "row", justifyContent: "center"}}>
                            <ul className="pagination pagination-lg mt-0 mb-0 mr-15">
                                {pagination.map(item=>{
                                    return item
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            }/>
        )
    }
}