import React from "react";
class Shade extends React.Component { 
  constructor(props){
    super(props)
    this.blackout = React.createRef();
    this.solar = React.createRef();
    this.state = {
      level: this.props.level
    }

  }
  componentWillReceiveProps(nextProps){
    this.setState({
      level: nextProps.level
    })
  }
  changeShadePos(event){
    var pos;
    if(event.key == "Enter"){
      event.preventDefault();
      pos = Number(event.target.innerHTML.replace("%", ""))
      var level = 100 - pos
      // console.log(pos)
    //   if(this.props.socket != null){
    //     this.props.socket.emit("blind", {RoomNumber: this.props.RoomNumber, vids: this.state.vids, level: level});
    // }
      this.animateShadeToLevel(pos);
    }
  }
  
  animateShadeToLevel(level){

      
    
      this.props.pos((level/100)*330)
  //     if((level/100)*330 >= this.state.blackoutPos){
  //     var blackout = setInterval(()=>{
  //       // console.log(this.state.blackoutPos);
  //       // console.log((level)*3.3)



  //       if(this.state.blackoutPos + 7.5 >= this.props.shadeMax * (level/100)){
  //         this.setState({
  //           blackoutPos: this.props.shadeMax * (level/100)
  //         });
  //       }
  //       else{
  //         this.setState((prevState, props) =>({
  //           blackoutPos: prevState.blackoutPos + 7.5
  //         }));  
  //       }

  //       if(this.state.blackoutPos === level * 3.3){
  //         console.log("Clearing Interval");
  //         clearInterval(blackout)
  //       }
  //     }, (12 * 100/4))


  //     var blackout = setInterval(()=>{
  //       if(this.state.blackoutPos - 7.5 <= this.props.shadeMax * (level/100)){
  //         this.setState({
  //           blackoutPos: this.props.shadeMax * (level/100)
  //         });
  //       }
  //       else{
  //         this.setState((prevState, props) =>({
  //           blackoutPos: prevState.blackoutPos - 7.5
  //         }));  
  //       }
  //       if(this.state.blackoutPos === level * 3.3){
  //         console.log("Clearing Interval");
  //         clearInterval(blackout)
  //       }
  //     }, (12 * 100/4))

  //    }
  //   }
  //   else{
  //     if((level/100)*330 >= this.state.solarPos){
  //     var solar = setInterval(()=>{
  //       if(this.state.solarPos + 7.5 >= this.props.shadeMax * (level/100)){
  //         this.setState({
  //           solarPos: this.props.shadeMax * (level/100)
  //         });
  //       }
  //       else{
  //         this.setState((prevState, props) =>({
  //           solarPos: prevState.solarPos + 7.5
  //         }));  
  //       }
  //       if(this.state.solarPos === level * 3.3){
  //         console.log("Clearing Interval");
  //         clearInterval(solar)
  //       }
  //     }, (12 * 100)/4)

  //   }
  //   else{
  //     var solar = setInterval(()=>{
  //       if(this.state.solarPos - 7.5 <= 0){
  //         this.setState({
  //           solarPos: this.props.shadeMax * (level/100)
  //         });
  //       }
  //       else{
  //         this.setState((prevState, props) =>({
  //           solarPos: prevState.solarPos - 7.5
  //         }));  
  //       }
  //       if(this.state.solarPos === level * 3.3){
  //         console.log("Clearing Interval");
  //         clearInterval(solar)
  //       }
  //     }, (12 * 100)/4)
  //   }
  // }
}
  render(){
    return (
        <div>
        
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288.5 375.22">
          <defs>
            <linearGradient id="linear-gradient" x1="302.86" y1="123.71" x2="314.77" y2="123.71" gradientTransform="translate(-285.55 51.51)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fff"/>
              <stop offset="1" stop-color="#231f20"/>
            </linearGradient>
            <linearGradient id="linear-gradient-2" x1="258.51" y1="175.14" x2="270.42" y2="175.14" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" />
            <linearGradient id="linear-gradient-3" x1="370.37" y1="170.39" x2="382.28" y2="170.39" gradientTransform="translate(-231.61 188.96)"/>
            <linearGradient id="linear-gradient-4" x1="288.72" y1="127.33" x2="298.07" y2="127.33" gradientTransform="translate(-148.49 -104.65)" gradientUnits="userSpaceOnUse">
              <stop offset="0.19" stop-color="#fff"/>
              <stop offset="1" stop-color="#231f20"/>
            </linearGradient>
            <clipPath id="clip-path" transform="translate(-0.45 -0.08)">
              <rect x="99" y="28.63" width="8.05" height="326.04" style={{fill: "none"}}/>
          </clipPath>
            <clipPath id="clip-path-2" transform="translate(-0.45 -0.08)">
              <rect x="99" y="28.63" width="8.05" height="326.05" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-4" transform="translate(-0.45 -0.08)">
              <rect x="179.29" y="27.35" width="8.05" height="326.04" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-5" transform="translate(-0.45 -0.08)">
              <rect x="179.3" y="27.35" width="8.05" height="326.05" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-7" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="151.2" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-8" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="151.2" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-10" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="86.84" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-11" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="86.84" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-13" transform="translate(-0.45 -0.08)">
              <rect x="29.94" y="293.74" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-14" transform="translate(-0.45 -0.08)">
              <rect x="29.94" y="293.74" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-16" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="223.19" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
            <clipPath id="clip-path-17" transform="translate(-0.45 -0.08)">
              <rect x="29.76" y="223.19" width="229.92" height="4.87" style={{fill: "none"}}/>
            </clipPath>
          </defs>
          <title>shade</title>
          <g style={{isolation: "isolate"}}>
            <g id="Layer_1" data-name="Layer 1">
              <rect x="17.31" y="1.58" width="11.91" height="347.3" transform="translate(46.08 350.37) rotate(180)" style={{stroke: "#231f20", strokeWidth: "0.5px",fill: "url(#linear-gradient)"}}/>
              <polyline points="16.86 1.49 16.86 348.79 0 348.79 0 1.49" style={{fill: "#e6e7e8"}}/>
              <polyline points="287.28 1.49 287.28 348.79 270.42 348.79 270.42 1.49" style={{fill: "#e6e7e8"}}/>
              <rect x="258.51" y="1.49" width="11.91" height="347.3" style={{stroke: "#231f20", strokeWidth: "0.5px", fill: "url(#linear-gradient-2)"}}/>
              <rect x="0.63" y="0.5" width="287.28" height="17.42" style={{fill: "#e6e7e8"}}/>
              <rect x="0.63" y="364.13" width="287.28" height="10.44" style={{fill: "#e6e7e8"}}/>
              <rect x="138.76" y="244.48" width="11.91" height="229.74" transform="translate(503.62 214.55) rotate(90)" style={{stroke: "#231f20", strokeWidth: "0.5px", fill: "url(#linear-gradient-3)"}}/>
              <rect x="140.23" y="-92.19" width="9.34" height="229.74" transform="translate(121.77 167.5) rotate(-90)" style={{stroke: "#231f20", strokeWidth: "0.5px", fill: "url(#linear-gradient-4)"}}/>
              <g style={{clipPath: "url(#clip-path)"}}>
                <g style={{clipPath: "url(#clip-path-2)"}}>
                  <g style={{clipPath: "url(#clip-path-2)"}}>
                    <image width="35" height="1359" transform="translate(98.43 28.52) scale(0.24)" />
                  </g>
                </g>
              </g>
              <g style={{clipPath: "url(#clip-path-4)"}}>
                <g style={{clipPath: "url(#clip-path-5)"}}>
                  <g style={{clipPath: "url(#clip-path-5)"}}>
                    <image width="34" height="1360" transform="translate(178.83 27.08) scale(0.24)"/>
                  </g>
                </g>
              </g>
              <g style={{clipPath: "url(#clip-path-7)"}}>
                <g style={{clipPath: "url(#clip-path-8)"}}>
                  <g style={{clipPath: "url(#clip-path-8)"}}>
                    <image width="960" height="22" transform="translate(29.07 150.92) scale(0.24)"/>
                  </g>
                </g>
              </g>
              <g style={{clipPath: "url(#clip-path-10)"}}>
                <g style={{clipPath: "url(#clip-path-11)"}}>
                  <g style={{clipPath: "url(#clip-path-11)"}}>
                    <image width="960" height="21" transform="translate(29.07 86.6) scale(0.24)"/>
                  </g>
                </g>
              </g>
              <g style={{clipPath: "url(#clip-path-13)"}}>
                <g style={{clipPath: "url(#clip-path-14)"}}>
                  <g style={{clipPath: "url(#clip-path-14)"}}>
                    <image width="959" height="22" transform="translate(29.31 293.48) scale(0.24)" />
                  </g>
                </g>
              </g>
              <g style={{clipPath: "url(#clip-path-16)"}}>
                <g style={{clipPath: "url(#clip-path-17)"}}>
                  <g style={{clipPath: "url(#clip-path-17)"}}>
                    <image width="960" height="22" transform="translate(29.07 222.92) scale(0.24)"/>
                  </g>
                </g>
              </g>
              <polygon points="0.63 0.5 144.27 0.57 288 0.64 288 374.72 0.63 374.57 0.63 0.5" style={{fill: "none", stroke: "#231f20", strokeMiterLimit: "10"}}/>
            </g>
            <g id="Solar" data-name="Layer 3">
              <g id="Blind" style={{opacity: "0.5", mixBlendMode: "darken"}}>
                <rect x="28.86" y="25" width="229.18" transformOrigin = "0 114.59" height={`${this.state.level}`} style={{fill: "rgb(230, 231, 232)", stroke: "#231f20", opacity: "1"}}/>
                {/* <path d="M29.31,259.62H258.49V257H29.31Z" transform="translate(-0.45 -0.08)" style={{fill: "#211f21",stroke: "#231f20", strokeMiterLimit: "10"}}/> */}
              </g>
            </g>
          </g>
        </svg>
      <div className="shade-widget-bar">
          <div className="shade-percentage" onKeyPress ={this.changeShadePos.bind(this)} contentEditable>0%</div>
        </div>
      </div>
    )
  }
}

Shade.defaultProps = {
  shadeMax: 330,
  shades: [],
  levels: []
}

export default Shade
