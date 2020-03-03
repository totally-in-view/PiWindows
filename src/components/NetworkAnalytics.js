import React from "react";
import {Doughnut,Scatter} from "react-chartjs-2";
export default class NetworkAnalytics extends React.Component{
    constructor(props){
        super(props)
        this.props.socket.emit("get-network-devices", this.props.instance);
        this.state = {
            chart: [],
            donuts: {},
            devices: [],
            filter: "",
            pages: 1,
            currentPage: 1
        }
    }
    UNSAFE_componentWillReceiveProps(nextProps){
        nextProps.socket.emit("get-network-devices", nextProps.instance);
    }
    componentDidMount(){
        this.props.socket.on("network-devices-line-data", (data)=>{
            let chartData = [];
            console.log(data);
            data.forEach((point)=>{
                let device = this.state.devices.find((device)=>{
                    return point.device.includes(`${device.instanceId}_${device.type.toLowerCase().replace(/[-.]/g, "_")}_${device.id}`);
                })

                if(device !== null){
                    chartData.push({
                        title: device.name,
                        dataPoints: point.dataPoints,
                        color: point.color
                    })
                }

                


            })
            
            this.setState({
                chart: chartData,
                pages: chartData.length/ 7,
                currentPage: 1
            })
        })

        this.props.socket.on("network-devices-doughnut-data", (data)=>{
            console.log(data);
            let donutData = {

            };
            this.state.devices.forEach((device)=>{
                if(donutData[device.type.toLowerCase().replace(/[-.]/g, "_")] != null){
                }else{
                    donutData[device.type.toLowerCase().replace(/[-.]/g, "_")] = {
                        online: [],
                        offline: []
                    }
                }
            })
            console.log(donutData);
            for(const prop in data){                
                let donutObj = donutData[prop]
                data[prop].forEach((item)=>{
                    if(item == "online"){
                        donutObj.online.push(item)
                    }else if(item == "offline"){
                        donutObj.offline.push(item)
                    };

                })
                donutData[prop] = donutObj;
            }
            this.setState({
                donuts: donutData
            });
            
        })

        this.props.socket.on("network-devices-bar-data", (data)=>{
        })

        this.props.socket.on("network-devices-return", (devices)=>{
            this.setState({
                devices: devices
            })
        })
    }

    selectDevice(event){
        let filter = event.target.value.toLowerCase().replace(/[-.]/g, "_")

        this.props.socket.emit("filter-network-devices", this.props.instance, filter);

        this.setState({
            filter: filter
        })
    }

    nextPage(){
        if(this.state.currentPage !== this.state.pages){
            this.setState((prevState, props)=>({
                currentPage: prevState.currentPage+1
            }))
        }
    }

    prevPage(){
        if(this.state.currentPage !== 1){
            this.setState((prevState, props)=>({
                currentPage: prevState.currentPage-1
            }))
        }
    }

    toCertainPage(page){
        this.setState({
            currentPage: page
        })
    }
    render(){
        let chart = [];
        let today = new Date();
        let yAxis = "Network Status(0 = Offline, 100 = Online)"
        let rightArrow = "",
        leftArrow = "";
        let donuts = []
        if(this.state.currentPage === 1){
            leftArrow = "hidden"
        }
        if(this.state.currentPage >= this.state.pages){
            rightArrow = "hidden"
        }

        today.setHours(0, 0, 0, 0);
        let endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 0);

        let paginationCircles = [];
        if(this.state.chart.length !== 0){
            for(var i = 1; i <= this.state.pages+1; i++){
                if(i === this.state.currentPage){
                    paginationCircles.push(<div onClick={this.toCertainPage.bind(this, i)} className="pi-card-pagination active"/>)
                }
                else{
                    paginationCircles.push(<div onClick={this.toCertainPage.bind(this, i)} className="pi-card-pagination" />);
                }
            }
        }
        if(this.state.chart.length > 0){
            for(var i = (this.state.currentPage-1)*7; i < this.state.currentPage * 7; i++){
                if(i >= this.state.chart.length){
    
                }else{
                    let line = this.state.chart[i];
                    let data = [];
                    line.dataPoints.forEach((point)=>{
                        let time = new Date(point.eventTime);
                        if(today.getTime() <= time.getTime() && time.getTime() <= endOfToday.getTime()){
                            data.push({x:time, y: point.online});
                        }
                    });
                    chart.push({
                        label: line.title,
                        borderColor: line.color,
                        data: data,
                        fill: "none"
                    })
                }
            }
        }
        
        let devices = [];

        this.state.devices.forEach((device)=>{
            if(devices.indexOf(device.type) < 0){
                devices.push(device.type);
            }
        })

            for(const type in this.state.donuts){
                donuts.push(<Doughnut
                    data={{
                        datasets: [
                            {   
                                data: [this.state.donuts[type].online.length, this.state.donuts[type].offline.length],
                                backgroundColor: ["#09a275", "#dc0030"]
                            },
              
                        ],
                        labels: ["Online", "Offline"]
                    }}

                    options={{
                        title:{
                            display: true,
                            text: `${type}`
                        }
                    }
                        
                    }
                    />)
            }
                            
        return(
            <div style={{display: "flex", flexFlow: "column", alignItems: "center",}}>
                <div style={{display: "flex", flexFlow: "column"}}>
                    <h2>Network Device Type</h2>
                    <select style={{marginTop: "10px"}} className="form-control" onChange={this.selectDevice.bind(this)}>
                        <option></option>
                        {devices.map((value)=>{
                            return <option>{value}</option>
                        })}
                    </select>
                </div>
                <div style={{display: "flex", flexFlow: "row wrap"}}>
                       {donuts.map((donut, key)=>{
                           return <div key={key}>{donut}</div>
                       })} 
                </div>
                <div style={{width: "100%", display: "flex", flexFlow: "row", justifyContent: "space-evenly", margin: "10px"}}>
                <div style={{alignSelf: "center", justifySelf: "flex-start", visibility: leftArrow}}><span onClick={this.prevPage.bind(this)} className="fa fa-arrow-circle-o-left fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>
                <div style={{width: "1200px"}}>
                    <Scatter
                        data={{
                            datasets: chart
                        }} 
                        options={{
                            showLines: true,
                            scales: {
                                xAxes: [{
                                    type: "time",
                                    time: {
                                        unit: "hour",
                                        stepSize: 1
                                    },
                                    ticks: {
                                        maxTicksLimit: 24,
                                        autoSkip: true
                                    }
                                }]
                            },
                            responsive: true,
                            maintainAspectRatio: true,
                            tooltips: {
                                enabled: true,
                                custom: ()=>{

                                }
                            }
                        }}
                    />
                </div>
                <div style={{alignSelf: "center", justifySelf: "flex-end", visibility: rightArrow}}><span onClick={this.nextPage.bind(this)} className="fa fa-arrow-circle-o-right fa-3x" style={{fontSize: "50px", color: "#fff", cursor: "pointer"}}></span></div>

                </div>

                <div style={{display: "flex", justifyContent: "center"}}>
                    {paginationCircles}
                </div>
            </div>
        )
    }
}