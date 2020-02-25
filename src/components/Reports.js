import React from "react";

export default class Reports extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            report: {
                "": []
            },
            header: [],
            filter: "",
            reportType: "Network"
        }
    }

    static getDerivedStateFromProps(props,state){

    }

    componentDidMount(){
        this.props.socket.on("report-return", (report)=>{
            if(this.state.reportType != "Diagnostics"){
                let filters = Object.keys(report);

                this.setState({
                    report: report,
                    filter: filters[0]
                })
            }else{
                let diagnosticsReport = {}
                let filters = Object.keys(report);
                for(const filter of filters){
                    for(const type of report[filter].types){
                        diagnosticsReport[`${filter} - ${type}`] = report[filter].devices.filter(device=>{
                            return device.type == type
                        });
                    }
                }
                let filter = Object.keys(diagnosticsReport)[0];
                this.setState({
                    report: diagnosticsReport,
                    filter: filter
                })
            }
        })
    }
    changeReportType(type){
        let typeEvent = type.replace(" ", "-").toLowerCase();
        this.props.socket.emit(`get-${typeEvent}-report`);
        this.setState({
            reportType: type
        })
    }

    filter(event){
        let filter = event.target.value;
        let header = []
        try{
            header = Object.keys(this.state.report[filter][0]);
        }catch(err){
            
        }
        this.setState({
            header: header,
            filter: filter
        })
    }

    downloadReport(){
        this.props.socket.emit("download-report", this.state.reportType.replace(" ", "-").toLowerCase());
    }
    render(){
        let filters = Object.keys(this.state.report);
        let sheet = [];
        try{
            sheet = this.state.report[this.state.filter] == null ? [] : this.state.report[this.state.filter];
        }catch(err){
            console.log(err);
        }
        
        return( <div style={{width:"100%"}}>
                    <div className="reports-header">
                        <div className="reports-title">{this.state.reportType} Report</div>
                        <div className="reports-nav">
                            {/* <div className="reports-nav-item" onClick={this.changeReportType.bind(this, "Diagnostics")}>Diagnostics</div> */}
                            <div className="reports-nav-item" onClick={this.changeReportType.bind(this, "Network")}>Network</div>
                            <div className="reports-nav-item" onClick={this.changeReportType.bind(this, "Bus")}>Bus</div>
                            <div className="reports-nav-item" onClick={this.changeReportType.bind(this, "As Built")}>As Built</div>
                            <div className="reports-nav-item" onClick={this.changeReportType.bind(this, "Trigger")}>Trigger</div>
                        </div>
                    </div>
                    <div style={{display: "flex", flexFlow: "row", alignItems:"center"}}>
                        <select onChange={this.filter.bind(this)} className="form-control mt-10 mb-10">
                            <option>Filter</option>
                            {filters.map(filter=>{
                                return <option>{filter}</option>
                            })}
                        </select>
                        <i style={{fontSize: "20px"}} title="Download" onClick={this.downloadReport.bind(this)} className="fa fa-cloud-download font-button"></i>
                    </div>
                    <div className="row">
                        <div className="col-sm-12" style={{color: "#fff"}}>
                            <table className="table table-hover mb-0" style={{color:"#fff"}}>
                                <thead>
                                    <tr>
                                        {this.state.header.map(head=>{
                                            if(head.toLowerCase() != "online" && head != "up" && head != "down" && head != "hold"){
                                                return <th>{head}</th>
                                            }
                                        })}
                                        {((header)=>{
                                            if(header.indexOf("online") > -1){
                                                return <th>Online</th>
                                            }
                                        })(this.state.header)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sheet.map((item, index)=>{
                                        let row = [];
                                        let online = null;
                                        this.state.header.forEach((head)=>{
                                            if(head == "online"){
                                                online = item[head] == "true" ? <td><span className="device-online"></span></td> : <td><span className="device-offline"></span></td>
                                            }else if(head == "occupancytask" || head == "vacancytask" || head == "uptask" || head == "downtask"){
                                                let name = ""
                                                try{
                                                    name = item[head].name;
                                                }catch(err){}
                                                row.push(<td>{name}</td>)
                                            }else if(head === "params" || head === "eventObjects"){
                                                row.push(<td>{item[head].toString()}</td>)
                                            }else if(head == "down" || head == "up" || head == "hold"){
                                            }else{
                                                row.push(<td>{item[head]}</td>);
                                            }
                                        })
                                        row.push(online);
                                        return <tr>
                                                    {row}
                                                </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>)
    }
}