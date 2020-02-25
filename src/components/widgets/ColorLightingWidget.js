import React from "react";
import Button from "./Button";
import {genAPICall} from "./API";
export default class ColorLightingWidget extends React.Component {
    constructor(props){
        super(props)
        this.canvas = React.createRef();
        this.context = null

        this.state = {
            alpha: 255,
            currentColor: [255, 255, 255],
            currentColorHex: "#FFFFFF"
        }
    }

    componentDidMount(){
        var canvas = this.canvas.current;

        this.context = canvas.getContext("2d");
        this.drawColorWheel(150)
    }
    changeLevel(dim, event){
        var value = event.target.value;

        console.log(dim)
        
        var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, dim.name, [value]);
        this.props.socket.emit("phoenix-api-call",apiCall);
        this.setState({
            alpha: value * 2.55
        })
    }
    drawColorWheel(radius){
        var image = this.context.createImageData(2*radius, 2*radius),
            data = image.data;

        for(let x = -radius; x < radius; x++){
            for(let y = -radius; y < radius; y++){
                let r = Math.sqrt(x*x + y*y);
                let phi = Math.atan2(y, x)
                if(r > radius){
                    continue;
                }
                let deg = ((phi + Math.PI) / (2 * Math.PI)) * 360; 
                const rowLength = 2 * radius;
                const adjustedX = x + radius;
                const adjustedY = y + radius;
                let pixelWidth = 4;
                let index = (adjustedX + (adjustedY * rowLength)) * pixelWidth;
                let hue = deg;
                let saturation = r/radius;
                let value = 1.0
                
                let [red, green, blue] = this.hsv2rgb(hue, saturation, value);
                let alpha = 255;
                // console.log([red, green, blue])
                data[index] = red;
                data[index+1] = green;
                data[index+2] = blue;
                data[index+3] = alpha;
            }
        }
        console.log(image.data);
        console.log(data);
        this.context.putImageData(image, 0, 0);
    }
    
    hsv2rgb(hue, saturation, value) {
        let chroma = value * saturation;
        let hue1 = hue / 60;
        let x = chroma * (1- Math.abs((hue1 % 2) - 1));
        let r1, g1, b1;
        if (hue1 >= 0 && hue1 <= 1) {
          ([r1, g1, b1] = [chroma, x, 0]);
        } else if (hue1 >= 1 && hue1 <= 2) {
          ([r1, g1, b1] = [x, chroma, 0]);
        } else if (hue1 >= 2 && hue1 <= 3) {
          ([r1, g1, b1] = [0, chroma, x]);
        } else if (hue1 >= 3 && hue1 <= 4) {
          ([r1, g1, b1] = [0, x, chroma]);
        } else if (hue1 >= 4 && hue1 <= 5) {
          ([r1, g1, b1] = [x, 0, chroma]);
        } else if (hue1 >= 5 && hue1 <= 6) {
          ([r1, g1, b1] = [chroma, 0, x]);
        }
        
        let m = value - chroma;
        let [r,g,b] = [r1+m, g1+m, b1+m];
        
        // Change r,g,b values from [0,1] to [0,255]
        return [255*r,255*g,255*b];
      }

    fullColorHex(rgb){
        var red = this.rgbToHex(rgb[0]);
        var green = this.rgbToHex(rgb[1]);
        var blue = this.rgbToHex(rgb[2]);
        
        return `#${red}${green}${blue}`
    }

    rgbToHex(rgb){
        var hex = Number(rgb).toString(16);
        if(hex.length < 2){
            hex = "0"+hex;
        }
        return hex;
    }

    hexToRGB(hex){
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);

        this.setState({
            currentColor: [r, g, b],
            currentColorHex: hex
        })
    }

    changeColor(event){
        if(event.key == "Enter"){
            event.preventDefault();
            this.hexToRGB(event.target.textContent);
        }
    }
    getColor(rgb, event){
        console.log(event);
        console.log(rgb);
        var pos = this.findPos(event);
        var x = pos.x
        var y = pos.y
        var coord = "x=" + x + ", y=" + y;
        console.log(`${coord}`);
        console.log(`${event.pageX}, ${event.pageY}`);
        console.log(pos);
        var c = event.target.getContext('2d');
        var rect = event.target.getBoundingClientRect();
        var index = (Math.floor(y) * this.canvas.width + Math.floor(x)) * 4
        // console.log(event.nativeEvent.target.getContext("2d"));
        var p = c.getImageData(x, y, 1, 1).data; 
        var hex = this.fullColorHex(p);
        var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, rgb.name, [p[0],p[1], p[2]]);
            console.log(apiCall);
            this.props.socket.emit("phoenix-api-call", apiCall)
        this.setState({
            currentColor: p,
            currentColorHex: hex
        });
    }
    

    findPos(obj) {
        var rect = obj.target.getBoundingClientRect();
        
        return {
            x: obj.clientX - rect.left,
            y: obj.clientY - rect.top
        }
    }

    toggleAlpha(on, off, event){
  
        if(this.state.alpha > 0){
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, off.name, [0]);
            console.log(apiCall);
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                alpha: 0
            });
        }
        else{
            var apiCall = genAPICall(this.props.properties.type, this.props.properties.id, on.name, [254]);
            console.log(apiCall);
            this.props.socket.emit("phoenix-api-call", apiCall)
            this.setState({
                alpha: 254
            })
        }
    }

    render(){
        var onOff = {
            on: "",
            off: ""
        }
        var dim;
        var rgb;
        this.props.functions.forEach((funct)=>{
            if(funct.widget == "Button"){
                if(funct.name.includes("on")){
                    onOff.on = funct
                }
                else{
                    onOff.off = funct
                }
            } else if(funct.widget == "Slider"){
                dim = funct
            } else if(funct.widget == "ColorWheel"){
                rgb = funct
            }
        });
        return(
            <div className="widgetcontainer">
            <div className="widgetheader">
                <div className="left">
                    <div className="button" ><Button onClick={this.toggleAlpha.bind(this,onOff.on, onOff.off)}/></div>
                    <div className="light-name">{this.props.properties.name}</div>
                </div>
                <div className="light-level" onKeyPress={this.changeColor.bind(this, dim)} contentEditable>{this.state.currentColorHex}</div>
            </div>
            <div class="colorpicker">
                <canvas ref={this.canvas} width="300px" height="300px" onClick={this.getColor.bind(this, rgb)}/>            
            </div>
                <input style={{background: `linear-gradient(to right, rgb(0,0,0), rgb(${this.state.currentColor[0]}, ${this.state.currentColor[1]}, ${this.state.currentColor[2]}))`}} type="range" class="slider" list="ranges" onChange={this.changeLevel.bind(this, dim)} value={this.state.alpha/2.55}/>
        </div>
        )
    }
}

function drawMultiRadiantCircle(ctx, xc, yc, r, radientColors) {
    var partLength = (2 * Math.PI) / radientColors.length;
    var start = 0;
    var gradient = null;
    var startColor = null,
        endColor = null;

    for (var i = 0; i < radientColors.length; i++) {
        startColor = radientColors[i];
        endColor = radientColors[(i + 1) % radientColors.length];

        // x start / end of the next arc to draw
        var xStart = xc + Math.cos(start) * r;
        var xEnd = xc + Math.cos(start + partLength) * r;
        // y start / end of the next arc to draw
        var yStart = yc + Math.sin(start) * r;
        var yEnd = yc + Math.sin(start + partLength) * r;

        ctx.beginPath();

        gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1.0, endColor);

        ctx.fillStyle = gradient;
        ctx.arc(xc, yc, r, start, start + partLength);
        ctx.lineWidth = 30;
        ctx.stroke();
        ctx.closePath();

        start += partLength;
    }
}

ColorLightingWidget.defaultProps = {
    colors: [
        "#FF0000",
        "#FFFF00",
        "#00FF00",
        "#00FFFF",
        "#0000FF",
        "#FF00FF"
        ]
}