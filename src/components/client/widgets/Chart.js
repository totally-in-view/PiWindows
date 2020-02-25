import React from "react";
import  {ctof} from "./Conversion";
import {Scatter} from "react-chartjs-2"

export default class Chart extends React.Component {
    constructor(props){
        super(props);
        
        this.state = {
            
            chart: []
        };
    }
    componentDidMount(){
        this.props.socket.emit("get-pi-devices", this.props.instanceId);

        this.props.socket.on("pi-devices-response", (data)=>{
            let chartData = [];
            data.forEach((point)=>{
                let deviceIndex = this.props.devices.findIndex(device=>{
                    return point.device.includes(`${device.props.instanceId.id}_${device.props.type.toLowerCase()}_${device.props.id}`)
                })
                if(deviceIndex > -1){
                    let device = this.props.devices[deviceIndex];
                    let chartLineIndex = chartData.findIndex(line=>{
                        return line.title === device.props.name
                    });
                    if(chartLineIndex < 0){
                        chartData.push({
                            title: device.props.name,
                            dataPoints: point.dataPoints,
                            color: point.color
                        });
                    }
                    
                }
            })
            this.setState({
                chart: chartData
            })
        })
    }
    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    render(){
        let dataLines = []
        let timeLabels = []
        let yAxis = ""
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 0);
        if(this.props.type === "Light"){
            yAxis = "Level";
            this.state.chart.forEach((line)=>{
                let data = []    
            
                line.dataPoints.forEach((point)=>{
                    let time = new Date(point.eventTime);
                    if(today.getTime() <= time.getTime() && time.getTime() <= endOfToday.getTime()){
                        data.push({x:time, y: point.level});
                    }
                });
                dataLines.push({
                    label: line.title,
                    borderColor: line.color,
                    data: data,
                    fill: "none"
                })
            })
        }else if(this.props.type === "Thermostat"){
            this.state.chart.forEach((line)=>{
                let roomData = [];
                let coolData = [];
                let heatData = [];

                line.dataPoints.forEach((point)=>{
                    let time = new Date(point.eventTime);
                    
                if(today.getTime() <= time.getTime() && time.getTime() <= endOfToday.getTime()){
                    roomData.push({x:time, y: ctof(parseInt(point.room))});
                    if(point.cool !== null){
                        coolData.push({x:time, y: ctof(parseInt(point.cool))});
                    } 
                    if(point.heat !== null){
                        heatData.push({x:time, y: ctof(parseInt(point.heat))});
                    }
                }
            })

            dataLines.push({
                label: `${line.title}: Room`,
                borderColor: "#58AEB1",
                data: roomData,
                fill: "none"
            });

            dataLines.push({
                label: `${line.title}: Cool`,
                borderColor: "#3BBBFF",
                data: coolData,
                fill: "none"
            });

            dataLines.push({
                label: `${line.title}: Heat`,
                borderColor: "#FFA428",
                data: heatData,
                fill: "none"
            })
        })
    }
        return(
            <Scatter 
            data={{
                datasets: dataLines
            }}
            options={{
                showLines: true,
                yAxisID: yAxis,
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            unit: "minute",
                            stepSize: 1
                        },
                        ticks: {
                            maxTicksLimit: 20,
                            autoSkip: true,
                        }
                    }]
                },
                responsive: true
            }}
            />
        )
    }
}