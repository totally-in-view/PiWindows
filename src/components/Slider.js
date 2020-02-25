import React from 'react';

export default class Slider extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            ...this.props
        }
    }
    

    handleSliderChange(event){
            if(event.target.value >= this.state.min && event.target.value <= this.state.max){
                this.props.change(event.target.value)
                this.setState({
                    value: event.target.value
                })
            }
    }

    changeMinimum(event){
        if(Number(event.target.value ) > this.state.value && Number(event.target.value) > this.state.max){
            this.setState({
                min: Number(event.target.value),
                value: Number(event.target.value),
                max: Number(event.target.value)+1
            })
        }
        else if(Number(event.target.value) > this.state.value){
            this.setState({
                min: Number(event.target.value),
                value: Number(event.target.value),
            })
        }
        else{
            this.setState({
                min: Number(event.target.value)
            })
        }
    }

    changeMaximum(event){
        if(Number(event.target.value) < this.state.value && Number(event.target.value) < this.state.min){
                this.setState({
                    max: Number(event.target.value),
                    min: Number(event.target.value)-1,
                    value: Number(event.target.value)
            });
        }
        else if(Number(event.target.value) < this.state.value){
            this.setState({
                max: Number(event.target.value),
                value: Number(event.target.value)
            });
        }
        else{
            this.setState({
                max: Number(event.target.value)
            }); 
        }
    }

    changeValue(event){
        this.setState({
            value: Number(event.target.value)
        })
    }

    render(){
        var ranges = [];
        ranges.push(<option value={`${this.state.rangeMin}`} />)
        var i = this.state.rangeMin;
        while(i < this.state.rangeMax){
            i = i+10;
            ranges.push(<option value={`${i}`} label={`${i}`} />)
        }
        return(
            <div className="slidercontainer">
                <input onChange={this.handleSliderChange.bind(this)}type="range" value={this.state.value} class="slider" list="ranges"/>
                <div className="slider-inputs">
                <input type="number" className="slider-input" value={this.state.min} onChange={this.changeMinimum.bind(this)}/>
                <input type="number" className="slider-input" value={this.state.value} onChange={this.changeValue.bind(this)}/>
                <input type="number" className="slider-input" value={this.state.max} onChange={this.changeMaximum.bind(this)}/>
                </div>
                <datalist id="ranges">
                    {ranges}
                </datalist>

            </div>
        )
    }
}


Slider.defaultProps = {
    value: 50,
    min: 20,
    max: 80,
    rangeMin:0,
    rangeMax: 100
}