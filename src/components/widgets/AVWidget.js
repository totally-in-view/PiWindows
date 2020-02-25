import React from "react";
import AVService from "./AVService";
import DPad from "./DPad";
import FastForward from "./FastForward";
import Play from "./Play";
import Replay from "./Replay";
import Rewind from "./Rewind";
import Shuffle from "./Shuffle";
import SkipBack from "./SkipBack";
import SkipForward from "./SkipForward";
import coverArt from "./cover-art.png"

export default class AVWidget extends React.Component {
    constructor(props){
        super(props);
        
        this.state = {
            recentSearches: [],
            currentSong: {
                title: "New Divide",
                artist: "Linkin Park",
                duration: 268
            },
            volume: 0,
            currentTimePlacement: 0,
            songPlayingInterval: "",
            fastForwardMultiplier: .5,
            rewindMultiplier: 2
        }
    }

    play(){
        var interval = setInterval(()=>{
            if(this.state.currentTimePlacement == this.state.currentSong.duration){
                clearInterval(this.state.songPlayingInterval);
            }
            else{
                var time = this.state.currentTimePlacement;
                time += 1;
                this.setState({
                    currentTimePlacement: time,
                    songPlayingInterval: interval
                })
            }
        }, 1000);
        
    }

    fastforward(){
        clearInterval(this.state.songPlayingInterval);
        var interval = setInterval(()=>{
            if(this.state.currentTimePlacement == this.state.currentSong.duration){
                clearInterval(this.state.songPlayingInterval);
            }
            else{
                var time = this.state.currentTimePlacement;
                var multiplier = this.state.fastForwardMultiplier/2
                time += 1;

                this.setState({
                    currentTimePlacement: time,
                    songPlayingInterval: interval,
                    fastForwardMultiplier: multiplier
                })
            }
        }, 1000 * this.state.fastForwardMultiplier)
        
    }

    rewind(){
        clearInterval(this.state.songPlayingInterval);
        var interval = setInterval(()=>{
            if(this.state.currentTimePlacement == this.state.currentSong.duration){
                clearInterval(this.state.songPlayingInterval);
            }
            else{
                var time = this.state.currentTimePlacement;
                var multiplier = this.state.rewindMultiplier * 2
                time -= 1;

                this.setState({
                    currentTimePlacement: time,
                    songPlayingInterval: interval,
                    rewindMultiplier: multiplier
                })
            }
        }, 1000 * this.state.rewindMultiplier)
    }

    volume(event){
        this.setState({
            volume: event.target.value
        })
    }
    mute(event){
        console.log("Mute!");
    }
    search(event){
        if(event.key == "Enter"){
            event.preventDefault();
            var searches = this.state.recentSearches;

            searches.push(event.target.value);
            this.setState({
                recentSearches: searches 
            })
        }
    }

    render(){

        var searches = [];

        this.state.recentSearches.forEach((search)=>{
            searches.push(<div className="recent-search">{search}</div>);
        })

        var currentPlacementSeconds = this.state.currentTimePlacement % 60;
        var currentPlacementMinutes = Math.floor(this.state.currentTimePlacement/60);
        var songduration = `${String(Math.floor(this.state.currentSong.duration/60)).padStart(2, "0")}:${String(this.state.currentSong.duration % 60).padStart(0, "0")}`
        var currentPlacement = `${String(currentPlacementMinutes).padStart(2, "0")}:${String(this.state.currentTimePlacement%60).padStart(2, "0")}`
        return (
            <div className="widgetcontainer av-widget">
            <div className="av-widget-left">
                <img  className="cover-art" src={coverArt}/>
                <div className="av-controls">
                    <DPad className="av-dpad" style={{width: "60%"}} />
                    <div>
                        <div className="top-row">
                            <Replay className="av-control" style={{width: "10%"}}/>
                            <Shuffle className="av-control" style={{width: "10%"}}/>
                            <AVService className="av-control" style={{width: "10%"}}/>
                        </div>
                        <div className="bottom-row">
                            <SkipBack className="av-control" style={{width: "10%"}} />
                            <Rewind onClick={this.rewind.bind(this)} className="av-control" style={{width: "10%"}} />
                            <Play onClick={this.play.bind(this)}className="av-control" style={{width: "10%"}} />
                            <FastForward onClick={this.fastforward.bind(this)}className="av-control" style={{width: "10%"}} />
                            <SkipForward className="av-control" style={{width: "10%"}} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="av-widget-right">
                <div className="search-bar">
                <div></div>
                <input type="text" className="search" placeHolder="Search" onKeyPress={this.search.bind(this)}/>
                </div>
                <div className="recent-searches">
                    {searches}
                </div>
                <div className="av-metadata">
                    <div className="song-name"><div>{this.state.currentSong.artist}</div>: <div>{this.state.currentSong.title}</div></div>
                    <div className="song-duration"><div>{currentPlacement}</div> / <div>{songduration}</div></div>

                    <input type="range" class="slider song-slider" step={1.667} max={this.state.currentSong.duration} value={this.state.currentTimePlacement} />
                    <input type="range" class="slider volume-slider" value={this.state.volume} onChange={this.volume.bind(this)} onClick={this.mute.bind(this)}/>
                </div>
            </div>
            </div>
        )
    }
}