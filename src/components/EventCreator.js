import React from "react";
import Modal from "./Modal";
import MultiSelect from "./MultiSelect";

export default class EventCreator extends React.Component {
    constructor(props){
        super(props)

        this.state={
            selector: "weekly",
            recurringActive: [
                {
                    day: "Sun",
                    class: "inactive"
                },
                {
                    day: "Mon",
                    class: "inactive"
                },
                {
                    day: "Tues",
                    class: "inactive"
                },
                {
                    day: "Wed",
                    class: "inactive"
                },
                {
                    day: "Thurs",
                    class: "inactive"
                },
                {
                    day: "Fri",
                    class: "inactive"
                },
                {
                    day: "Sat",
                    class: "inactive"
                }
        ],

        event: {
            type: "weekly",
            days: [],
            actions: []
        }
        }
    }
    componentWillReceiveProps(nextProps){
        this.setState({
            event: {
                type: "weekly",
                days: [],
                actions: []
            },
            recurringActive: [
                {
                    day: "Sun",
                    class: "inactive"
                },
                {
                    day: "Mon",
                    class: "inactive"
                },
                {
                    day: "Tues",
                    class: "inactive"
                },
                {
                    day: "Wed",
                    class: "inactive"
                },
                {
                    day: "Thurs",
                    class: "inactive"
                },
                {
                    day: "Fri",
                    class: "inactive"
                },
                {
                    day: "Sat",
                    class: "inactive"
                }
            ]
        });
    }
    toWeeklySelector(event){
        event.preventDefault();

        var eve = this.state.event;

        eve.type = "weekly"
        eve.days = []
        this.setState({
            selector: "weekly",
            event: eve
        })
    }

    toDateSelector(event){
        event.preventDefault();
        var eve = this.state.event;

        eve.type = "specificDate"
        eve.days = []
        this.setState({
            selector: "date",
            event: eve
        })
    }

    toActions(event){
        event.preventDefault();

        this.setState({
            selector: "actions"
        })
    }

    toggleRecurringDay(recurringDay){
        var days = this.state.recurringActive;
        var event = this.state.event;
        var eventDays = event.days;
        days.forEach((day)=>{
            if(day.day == recurringDay){
                if(day.class == "active"){
                    day.class = "inactive"
                    eventDays = eventDays.filter(eventDay => eventDay != day.day)
                    console.log(eventDays);
                }
                else{
                    day.class = "active"
                    eventDays.push(day.day);
                }
            }
        });
        event.days = eventDays;
        this.setState({
            recurringActive: days,
            event: event
        });
    }
    getEventName(event){
        var eve = this.state.event;
        eve["name"] = event.target.value;
        this.setState({
            event: eve
        });
    }
    getStartTime(event){
        var eve = this.state.event;
        eve["startTime"] = event.target.value;
        this.setState({
            event: eve
        });
    }

    getEndTime(event){
        var eve = this.state.event;
        eve["endTime"] = event.target.value;
        this.setState({
            event: eve
        });
    }

    getDay(event){
        var eve = this.state.event;
        eve.days = [];
        eve.days.push(event.target.value);
        this.setState({
            event: eve
        })
    }


    getColor(event){
        var eve = this.state.event;
        eve.tag = event.target.value;

        this.setState({
            event: eve
        })
    }

    getDevice(device){

        var event = this.state.event;

        event.actions.filter(scene => { return scene !== device});
        event.actions.push(device)
        this.setState((prevState, props)=>({
            event: event
        }))
    };
    close(){
        this.props.toggle();
    }

    save(){
        this.props.saveEvent(this.state.event);
    }
    render(){
        var weeklyActive,
            dayActive,
            actionActive,
            ui;
        if(this.state.selector == "weekly"){
            weeklyActive = "active";
            actionActive = "";
            dayActive = "";
            var days = [];
            this.state.recurringActive.forEach((day)=>{
                days.push(
                    <div className={day.class} onClick={this.toggleRecurringDay.bind(this, day.day)}>{day.day}</div>
                )
            })

            ui = <div className="week">
                    {days}
                 </div>
        }else if(this.state.selector == "date"){
            weeklyActive = "";
            actionActive = "";
            dayActive = "active";
            ui = <div className="col-sm-12">
                    <div className="form-group">
                        <label className="control-label mb-10 text-left">
                            One Time Event
                        </label>
                        <input className="form-control" onChange={this.getDay.bind(this)} type="date"/>
                    </div>
                </div>
                        
        }else{
            weeklyActive = ""; 
            actionActive = "active";
            dayActive = "";
            var options = [];

            this.props.devices.forEach((device)=>{
                var opt = `${device.props.instanceId} - ${device.props.area} - ${device.props.name} `
                device.functions.forEach((funct)=>{
                    options.push(`${opt} - ${funct.name}`);
                })
            })
            ui = <div className="col-sm-12">
                    <div className="form-group">
                        <label className="control-label mb-10 text-left">
                            Scenes
                        </label>
                        <MultiSelect options={options} sort={false} select={this.getDevice.bind(this)}/>
                    </div>
                </div>
        }
        
        return(
            <Modal
                close={this.props.close} 
                modalIsOpen={this.props.open}
                modalTitle={"Event Creator"}
                modalBody={
                    <div style={{height: "250px"}}>
                    <ul role="tablist" className="nav nav-tabs" id="myTabs_7">
						<li className={weeklyActive} role="presentation"  onClick={this.toWeeklySelector.bind(this)}><a aria-expanded="true" data-toggle="tab" role="tab" id="home_tab_7" href="#home_7">recurring</a></li>
						<li className={dayActive} role="presentation" class="" onClick={this.toDateSelector.bind(this)}><a data-toggle="tab" id="profile_tab_7" role="tab" href="#profile_7" aria-expanded="false" >one time</a></li>
                        <li className={actionActive} role="presentation" class="" onClick={this.toActions.bind(this)}><a data-toggle="tab" id="profile_tab_7" role="tab" href="#profile_7" aria-expanded="false" >actions</a></li>						
					</ul>
                    <div className="row">
                        {ui}
                    </div>
                    <div>

                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="control-label mb-10 text-left">
                                        event name
                                    </label>
                                    <input type="text" onChange={this.getEventName.bind(this)} className="form-control"/>
                                </div>
                            </div>
                        </div>
                <div className="row">
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="control-label mb-10 text-left">
                            tag picker
                        </label>
                        <input type="color" className="form-control colorpicker-element" onChange={this.getColor.bind(this)}/>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="form-group time-group">
                        <label className="control-label mb-10 text-left">
                            event start time
                        </label>
                        <div className="input-group date">
                            <input type="time" class="form-control" onChange = {this.getStartTime.bind(this)} placeholder="HH:MM"/>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="form-group time-group">
                        <label className="control-label mb-10 text-left">
                            event end time
                        </label>
                        <div className="input-group date">
                            <input type="time" class="form-control" onChange={this.getEndTime.bind(this)} placeholder="HH:MM"/>
                        </div>
                    </div>
                </div>
                </div>
                </div>
                    </div>
                }
                modalFooter={
                    <button style={{textAlign: "right"}} onClick={this.save.bind(this)} type='button' className="btn btn-lg btn-success">Save</button>
                }
            
            />


        )
    }
}


EventCreator.defaultProps = {
    toggle: ()=>{

    }
}