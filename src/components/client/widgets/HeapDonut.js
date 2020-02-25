import React from "react";

export default class HeapDonut extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            heapUsed: this.props.heapUsed,
            heapTotal: this.props.heapTotal
        }
    }

    render(){
        let donutLevel = parseInt((this.state.heapUsed/this.state.heapTotal).toFixed(2) * 100);
        let color = "#FFFFFF";
        return (
            <div style={{display: "flex", flexFlow: "column", alignItems: "center"}}>
            <svg width="100" height="100" viewBox="0 0 42 42">
                <g>
                <circle className="donut-ring" cx="21" cy="21" r="15.915494" fill="transparent" stroke="#5a5a5a" strokeWidth="4"></circle>
                <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={donutLevel} strokeDashoffset="0" ></circle>
                <circle cx="21" cy="21" r="13" fill="transparent" strokeWidth="3"></circle>
                <circle cx="21" cy="21" r="11" fill="transparent" stroke="#fff" strokeWidth="1"></circle>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em"fontSize="8px" fill={color}>{donutLevel}%</text>
                </g>
            </svg>
                
            </div>
        )
    }
}