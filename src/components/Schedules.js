import React from "react";
import Panel from "./Panel"
import EventCreator from "./EventCreator";
import {Route, Redirect, withRouter} from "react-router-dom"

import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {openEventCreator, closeEventCreator, addEvent, deleteEvent, toNextMonth, toPreviousMonth, changeView, next, prev, today, addDevices} from "../store/actions/index"
var electron = window.require("electron");
var ipcRenderer = electron.ipcRenderer

class Schedules extends React.Component{ 
    constructor(props){
        super(props)
        var clock = new Date();
        this.saveEvent = this.saveEvent.bind(this);
        this.state = {
            clock: clock,
            timezone: "EST",
            view: "month",
            events: [],
            eventCreatorOpen: false,
            month: this.props.months[clock.getMonth()]
        }
    }


    componentDidMount(){
      console.log(this.props);
      this.props.socket.emit("get-devices-from-db")
      
      ipcRenderer.on("getting-instance-devices", (event, msg)=>{
        var devices = this.props.schedules.devices;
        console.log(devices)
        msg.scenes.forEach((device)=>{
          device.props.instanceId = msg.instance
          devices.push(device)
        })

        this.props.addDevices(devices)
      });

      this.props.socket.on("return-devices-from-db", (devices)=>{
        console.log(devices);
      })
    }
    toCalendarView(view){
        this.setState({
            view: view
        })
    }

    toggleEventCreator(){
        this.setState({
            eventCreatorOpen: true
        })
    }

    saveEvent(event){
      console.log(event);
      this.props.addEvent(event);
      this.props.socket.emit("save-event", event);
      // this.props.add(event);
    }
    nextMonth(){
      // if(this.state.view == "month"){
      //   var monthIndex = this.props.months.indexOf(this.state.month);
      //   var year;
      //   var clock = this.state.clock;
      //   console.log(monthIndex);
      //   if(monthIndex == 11){
      //     monthIndex = 0;
      //     year = clock.getFullYear()+1
      //     clock.setFullYear(year);
      //   }
      //   else{
      //     monthIndex += 1;
      //   }
      
      //   clock.setMonth(monthIndex);

      //   console.log(clock.getMonth());
      //   this.setState((prevState, props)=>({
      //     month: props.months[monthIndex],
      //     clock: clock
      //   }));
      // }else if(this.state.view == "week"){
      //   var clock = this.state.clock;
      //   var currentDate = clock.getDate();
      //   var currentDay = clock.getDay();
      //   var month = clock.getMonth();
      //   var monthDays = this.props.months[month];
      //   var nextWeek = currentDate + 7;
      //   if(this.props.months[month] < nextWeek){
      //     if(month == 11){
      //       clock.setMonth(0)
      //     }
      //     //   nextMonthDays = this.props.month[]
      //   }
      // }
      
    }

    previousMonth(){
      var monthIndex = this.props.months.indexOf(this.state.month);
      console.log(monthIndex);
      var year;
      var clock = this.state.clock;
      if(monthIndex == 0){
        monthIndex = 11;
        year = clock.getFullYear()-1
        clock.setFullYear(year);
      }
      else{
        monthIndex -= 1;
      }
      
      clock.setMonth(monthIndex);

      console.log(clock.getMonth());
      this.setState((prevState, props)=>({
        month: props.months[monthIndex],
        clock: clock
      }));
    }

    removeEvent(calendarEvent){
      this.props.deleteEvent(calendarEvent)
    }
    render() {
        
        console.log(this.props.schedules)
        // console.log(this.props.schedule)
        var month = this.props.months[this.props.schedules.month]
        var calendarButtons;
        var eventsUI = [];
        var events = {
          sundays: [],
          mondays: [],
          tuesdays: [],
          wednesdays: [],
          thursdays: [],
          fridays: [],
          saturdays: [],
          specificDays: new Map()
        }
        for(var i = 0; i < this.props.schedules.events.length; i++){
            var event = this.props.schedules.events[i];
            event.days.forEach((day)=>{
              switch(day){
                case "Sun":
                  events.sundays.push(event);
                  break;
                case "Mon":
                  events.mondays.push(event);
                  break;
                case "Tues":
                  events.tuesdays.push(event);
                  break;
                case "Wed":
                  events.wednesdays.push(event);
                  break;
                case "Thurs":
                  events.thursdays.push(event);
                  break;
                case "Fri":
                  events.fridays.push(event);
                  break;
                case "Sat":
                  events.saturdays.push(event);
                  break;
                default:
                  if(event.type == "specificDate"){
                    event.days.forEach((day)=>{
                      let daySplit = day.split("-");
                      day = `${daySplit[1]}-${daySplit[2]}-${daySplit[0]}`
                      // console.log(day)
                    })
                    // console.log(event.days);
                    events.specificDays.set(event.days[0], event);
                  }
                  break;
              }
            });
            eventsUI.push(<div style={{background: event.tag, margin: "10px"}}className="calendar-event btn ui-draggable ui-draggable-handle">{event.name}<a onClick={this.removeEvent.bind(this,event)} class="remove-calendar-event"><i class="fa fa-times fa-fw"></i></a></div>)
        }
        // console.log(events);
        switch(this.props.schedules.view){
            case "month":
                calendarButtons =  <div className="fc-button-group"><button type="button" className="fc-month-button fc-button fc-state-default fc-corner-left fc-state-active" onClick={this.props.changeView.bind(this, "month")}>month</button><button type="button" className="fc-agendaWeek-button fc-button fc-state-default" onClick={this.props.changeView.bind(this,  "week")}>week</button><button type="button" className="fc-agendaDay-button fc-button fc-state-default fc-corner-right" onClick={this.props.changeView.bind(this,  "day")}>day</button></div>
                break;
            case "week":
                calendarButtons =  <div className="fc-button-group"><button type="button" className="fc-month-button fc-button fc-state-default fc-corner-left" onClick={this.props.changeView.bind(this,  "month")}>month</button><button type="button" className="fc-agendaWeek-button fc-button fc-state-default fc-state-active" onClick={this.props.changeView.bind(this,  "week")}>week</button><button type="button" className="fc-agendaDay-button fc-button fc-state-default fc-corner-right" onClick={this.props.changeView.bind(this,  "day")}>day</button></div>
                break;
            default:
                calendarButtons =  <div className="fc-button-group"><button type="button" className="fc-month-button fc-button fc-state-default fc-corner-left" onClick={this.props.changeView.bind(this,  "month")}>month</button><button type="button" className="fc-agendaWeek-button fc-button fc-state-default" onClick={this.props.changeView.bind(this,  "week")}>week</button><button type="button" className="fc-agendaDay-button fc-button fc-state-default fc-state-active fc-corner-right" onClick={this.props.changeView.bind(this,  "day")}>day</button></div>;
                break
            }
        // console.log(events);

        return (

          <Panel header={"Schedules"} body={
            <div className="calendar-wrap mt-40">
            
            <div id="calendar" className="fc fc-unthemed fc-ltr">
                <EventCreator saveEvent={this.saveEvent.bind(this)} close={this.props.closeEventCreator.bind(this)} open={this.props.schedules.eventCreatorOpen} devices={this.props.schedules.devices} />
                <div className="fc-events"><button type="button" className="fc-events-button" onClick={this.props.openEventCreator.bind(this)}>create event</button>{eventsUI}</div>
                <div className="fc-toolbar">
                <div className="fc-left">
                    <div className="fc-button-group"><button onClick={this.props.prev.bind(this)} type="button" className="fc-prev-button fc-button fc-state-default fc-corner-left"><span className="fc-icon fc-icon-left-single-arrow">{"<"}</span></button><button onClick={this.props.next.bind(this)} type="button" className="fc-next-button fc-button fc-state-default fc-corner-right"><span className="fc-icon fc-icon-right-single-arrow">></span></button></div>
                    <button type="button" className="fc-today-button fc-button fc-state-default fc-corner-left fc-corner-right fc-state-disabled" onClick={this.props.today.bind(this)}>today</button>
                </div>
                <div className="fc-right">
                    {calendarButtons}
                </div>
                <div className="fc-center">
                    <h2>{`${month} ${this.props.schedules.clock.getFullYear()}`}</h2>
                </div>
                <div className="fc-clear" />
                </div>
                <div className="fc-view-container" style={{}}>
                <Redirect to={`/schedules/${this.props.schedules.view}`}/> 
                <Route path="/schedules/month/" render={ ()=>{
                    // console.log(this.props.schedules.clock)
                    var currentDate = new Date();  
                    var dayStart;
    
                    var dates = []
                    var datesUI = [];
                    
                    dayStart = new Date(`${month} 1, ${this.props.schedules.clock.getFullYear()}`).getDay();
                    var daysAmount = this.props.daysAmount[month]
                    var prevMonth = this.props.daysAmount["December"];
                    var nextMonth = this.props.daysAmount["January"];
                    var prevMonthStr = "December";
                    var nextMonthStr = "January"
                    // console.log(prevMonth)
                    if(this.state.clock.getFullYear() % 4 == 0 && month == "February"){
                      daysAmount = 29
                    }
                    if(this.state.clock.getMonth() != 0){
                        prevMonthStr = this.props.months[this.props.schedules.clock.getMonth()-1]
                        prevMonth = this.props.daysAmount[prevMonthStr];
                    }
                    if(this.state.clock.getMonth() != 11){
                        nextMonthStr = this.props.months[this.props.schedules.clock.getMonth()+1]
                        nextMonth = this.props.daysAmount[nextMonthStr];
                    }

                    for(var j = prevMonth-dayStart+1; j <= prevMonth; j++){
                        var monthIndex = this.props.months.indexOf(prevMonthStr);
                        var date = new Date();
                        var dailyEvents = []
                        var leadingDayZero = ""
                        var leadingMonthZero = ""
                        date.setMonth(monthIndex);
                        date.setDate(j);
                        if(monthIndex == 11){
                          date.setFullYear(date.getFullYear()-1);
                        }
                        if(date.getDate() < 10){
                          leadingDayZero = "0"
                        }
                        if(date.getMonth()+1 < 10){
                          leadingMonthZero = "0"
                        }
                        var dateStr = `${date.getFullYear()}-${leadingMonthZero}${date.getMonth()+1}-${leadingDayZero}${date.getDate()}`;
                        // console.log(dateStr);
                        if(events.specificDays.has(dateStr)){
                          dailyEvents.push(events.specificDays.get(dateStr));
                        }
                          var day = date.getDay();
                          switch(day){
                            case 0:
                              dailyEvents.push(...events.sundays);
                              break;
                            case 1:
                              dailyEvents.push(...events.mondays);
                              break;
                            case 2:
                              dailyEvents.push(...events.tuesdays);
                              break;
                            case 3:
                              dailyEvents.push(...events.wednesdays);
                              break;
                            case 4:
                              dailyEvents.push(...events.thursdays);
                              break;
                            case 5:
                              dailyEvents.push(...events.fridays);
                              break;
                            case 6:
                              dailyEvents.push(...events.saturdays);
                              break;
                            default:
                              // console.log(events);
                              break;
                          }
                        
                        
                        dates.push({
                            month: prevMonthStr,
                            day: j,
                            calendarStyle: "past-day", 
                            events: dailyEvents
                        });
                    }
                    
                    for(var i = 1; i <= daysAmount; i++){
                      var monthIndex = this.props.months.indexOf(month);
                      // console.log(monthIndex);
                      var date = this.props.schedules.clock
                      var dailyEvents = []
                      var leadingDayZero = ""
                      var leadingMonthZero = ""
                      date.setMonth(monthIndex);
                      date.setDate(i);
                      if(monthIndex == 11){
                        date.setFullYear(date.getFullYear());
                      }
                      if(date.getDate() < 10){
                        leadingDayZero = "0"
                      }
                      if(date.getMonth()+1 < 10){
                        leadingMonthZero = "0"
                      }
                      var dateStr = `${date.getFullYear()}-${leadingMonthZero}${date.getMonth()+1}-${leadingDayZero}${date.getDate()}`;
                      // console.log(dateStr)
                      if(events.specificDays.has(dateStr)){
                        // console.log(events.specificDays.get(dateStr));
                        dailyEvents.push(events.specificDays.get(dateStr));
                      }
                        var day = date.getDay();
                        switch(day){
                          case 0:
                            dailyEvents.push(...events.sundays);
                            break;
                          case 1:
                            dailyEvents.push(...events.mondays);
                            break;
                          case 2:
                            dailyEvents.push(...events.tuesdays);
                            break;
                          case 3:
                            dailyEvents.push(...events.wednesdays);
                            break;
                          case 4:
                            dailyEvents.push(...events.thursdays);
                            break;
                          case 5:
                            dailyEvents.push(...events.fridays);
                            break;
                          case 6:
                            dailyEvents.push(...events.saturdays);
                            break;
                          default:
                            // console.log(events);
                            break;
                        }
                      
                        if(i < currentDate.getDate() && this.props.months[currentDate.getMonth()] == month && currentDate.getFullYear() == this.props.schedules.clock.getFullYear()){
                            dates.push({
                                month: month,
                                day: i,
                                calendarStyle: "past-day",
                                events: dailyEvents
                            });    
                        }else if(i == currentDate.getDate() && this.props.months[currentDate.getMonth()] == month && currentDate.getFullYear() == this.props.schedules.clock.getFullYear()){
                            dates.push({
                                month: month,
                                day: i,
                                calendarStyle: "today",
                                events: dailyEvents
                            });
                        }else{
                            dates.push({
                                month: month,
                                day: i,
                                calendarStyle: "future-day",
                                events: dailyEvents
                            })
                        }
                    }
                    var dateLengths = dates.length;
                    for(var i = dates.length; i < 42; i++){
                      // var monthIndex = this.props.months.indexOf(nextMonthStr);
                      var dailyEvents = []
                      var leadingDayZero = ""
                      var leadingMonthZero = ""
                      var date;
                      // console.log(nextMonthStr, monthIndex, date);
                      if(nextMonthStr == "January"){
                        date = new Date(`${nextMonthStr} ${i-dateLengths+1}, ${this.props.schedules.clock.getFullYear()+1}`)
                      }else{
                        date = new Date(`${nextMonthStr} ${i-dateLengths+1}, ${this.props.schedules.clock.getFullYear()}`);
                      }
                      // console.log(date);
                      if(date.getDate() < 10){
                        leadingDayZero = "0"
                      }
                      if(date.getMonth()+1 < 10){
                        leadingMonthZero = "0"
                      }
                      var dateStr = `${date.getFullYear()}-${leadingMonthZero}${date.getMonth()+1}-${leadingDayZero}${date.getDate()}`;
                      // console.log(dateStr)
                      if(events.specificDays.has(dateStr)){
                        // console.log(events.specificDays.get(dateStr))
                        dailyEvents.push(events.specificDays.get(dateStr));
                      }
                        var day = date.getDay();
                        switch(day){
                          case 0:
                            dailyEvents.push(...events.sundays);
                            break;
                          case 1:
                            dailyEvents.push(...events.mondays);
                            break;
                          case 2:
                            dailyEvents.push(...events.tuesdays);
                            break;
                          case 3:
                            dailyEvents.push(...events.wednesdays);
                            break;
                          case 4:
                            dailyEvents.push(...events.thursdays);
                            break;
                          case 5:
                            dailyEvents.push(...events.fridays);
                            break;
                          case 6:
                            dailyEvents.push(...events.saturdays);
                            break;
                          default:
                            // console.log(events)
                            break;
                        }
                      
                        dates.push({
                            month: nextMonthStr,
                            day: i-dateLengths+1,
                            calendarStyle: "future-day",
                            events: dailyEvents
                        });
                    }   
                    for(var i = 0; i < dates.length; i+=7){
                        var day1 = dates[i];
                        var day2 = dates[i+1];
                        var day3 = dates[i+2];
                        var day4 = dates[i+3];
                        var day5 = dates[i+4];
                        var day6 = dates[i+5];
                        var day7 = dates[i+6];
                        var events1 = [];
                        var events2 = [];
                        var events3 = [];
                        var events4 = [];
                        var events5 = [];
                        var events6 = [];
                        var events7 = [];
                        // console.log(day1)
                        // console.log(day1.events);
                        day1.events.forEach((event)=>{
                          // console.log(event)
                          events1.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day2.events.forEach((event)=>{
                          // console.log(event)
                          events2.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day3.events.forEach((event)=>{
                          // console.log(event)
                          events3.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day4.events.forEach((event)=>{
                          // console.log(event)
                          events4.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day5.events.forEach((event)=>{
                          // console.log(event)
                          events5.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day6.events.forEach((event)=>{
                          // console.log(event)
                          events6.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        day7.events.forEach((event)=>{
                          // console.log(event)
                          events7.push(<div className="event"><div style={{padding: "3px", background: event.tag, borderRadius: "10px", marginRight: "2px"}}></div>{event.name}</div>);
                        })
                        var weekRow = <div className="days-row">
                          <div className={`${day1.calendarStyle}`}>
                            <div className={`day`}>{day1.day}</div>
                            {events1}
                          </div>
                          <div className={`${day2.calendarStyle}`}>
                            <div className={`day`}>{day2.day}</div>
                            {events2}
                          </div>
                          <div className={`${day3.calendarStyle}`}>
                            <div className={`day`}>{day3.day}</div>
                            {events3}
                          </div>
                          <div className={`${day4.calendarStyle}`}>
                            <div className={`day`}>{day4.day}</div>
                            {events4}
                          </div>
                          <div className={`${day5.calendarStyle}`}>
                            <div className={`day`}>{day5.day}</div>
                            {events5}
                          </div>
                          <div className={`${day6.calendarStyle}`}>
                            <div className={`day`}>{day6.day}</div>
                            {events6}
                          </div>
                          <div className={`${day7.calendarStyle}`}>
                            <div className={`day`}>{day7.day}</div>
                            {events7}
                          </div>
                        </div>
                        datesUI.push(weekRow)
                        
                    }
                return (<div className="fc-view fc-month-view fc-basic-view" style={{}}>
                    <div className="monthly-calendar">
                      <div class="monthly-header row">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>

                      {datesUI}
                    </div>
                </div> )}} />

                <Route path="/schedules/week" render={()=>{
                    var week = [];
                    var weekUI = [];
                    console.log(this.props.schedules.clock)
                    var day = this.props.schedules.clock.getDay();
                    var date = this.props.schedules.clock.getDate();
                    var hoursUI = [];
                    var dayBeginning = date-day;

                    var amPM = "AM"
                    for(var i = 0; i < 24; i++){
                      var hour = i;
                      if(i >= 12){
                        hour = hour-12
                        amPM = "PM"
                      }
                      if(hour == 0){
                        hour = 12
                      }
                      hoursUI.push(<div className="row">
                                      <div>{`${hour}${amPM}`}</div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                  </div>)

                    hoursUI.push(<div className="row">
                                    <div>{`${hour}:30${amPM}`}</div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                </div>)

                    }

                    for(var i = dayBeginning; i < dayBeginning+7; i++){
                        var newDate = this.props.schedules.clock;
                        newDate.setDate(i);
                        console.log(this.props.days[newDate.getDay()]);
                        week.push({
                            date: newDate
                        });
                        if(date > i){
                            weekUI.push(<div className="past-day">{`${newDate.getMonth()+1}/${newDate.getDate()}/${newDate.getFullYear()}`}</div>)
                        }
                        else if(date == i){
                            weekUI.push(<div className="current-day">{`${newDate.getMonth()+1}/${newDate.getDate()}/${newDate.getFullYear()}`}</div>)
                        }
                        else{
                            weekUI.push(<div>{`${newDate.getMonth()+1}/${newDate.getDate()}/${newDate.getFullYear()}`}</div>)
                        }
                    }
                    console.log(week);
                    return(
                        <div>
  <div className="fc-view fc-agendaWeek-view fc-agenda-view" style={{}}>

    <div class="weekly-calendar">
      <div className="row header">
          <div>Time</div>
          {weekUI}
      </div>
      
      <div className="hours">
        {hoursUI}
      </div>
    </div>
  </div>
</div>

                    )
                }}/>

                <Route path="/schedules/day" render={()=>{
                  var hoursUI = [];
                  var amPM = "AM"
                  for(var i = 0; i < 24; i++){
                    var hour = i;
                    if(i >= 12){
                      hour = hour-12
                      amPM = "PM"
                    }
                    if(hour == 0){
                      hour = 12
                    }
                    hoursUI.push(<div>
                                    <div className="hour">{`${hour}${amPM}`}</div>
                                    <div className="events"></div>
                                </div>)

                  hoursUI.push(<div>
                                  <div className="hour">{`${hour}:30${amPM}`}</div>
                                  <div className="events"></div>
                              </div>)

                  }

                    return (
                        <div className="fc-view fc-agendaDay-view fc-agenda-view" style={{}}>
                          <div class="day-calendar">
                            <div class="day-calendar-header">
                              {`${this.props.schedules.clock.getMonth()+1}/${this.props.schedules.clock.getDate()}/${this.props.schedules.clock.getFullYear()}`}
                            </div>
                            <div className="hours">
                              {hoursUI}
                            </div>
                          </div>
                      </div>
                    )
                }} />
                </div>
            </div>
            </div>
          } />
      );
    }
  }


Schedules.defaultProps = {
    months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ],
    daysAmount: {
        "January": 31,
        "February": 28,
        "March": 31,
        "April": 30,
        "May": 31,
        "June": 30,
        "July": 31,
        "August": 31,
        "September": 30,
        "October": 31,
        "November": 30,
        "December": 31
    },
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]   
}

const mapDispatchToProps = dispatch =>{
  return bindActionCreators({
    openEventCreator: openEventCreator,
    closeEventCreator: closeEventCreator,
    toPreviousMonth: toPreviousMonth,
    toNextMonth: toNextMonth,
    addEvent: addEvent,
    deleteEvent: deleteEvent,
    changeView: changeView,
    next: next,
    prev: prev,
    today: today,
    addDevices: addDevices
  }, dispatch)
}

const mapStateToProps = state=>{
  return{
    schedules: state.schedules
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Schedules))