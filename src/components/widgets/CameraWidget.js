import React from "react";
import cameraPreview from "./camera-preview.png"
export default class CameraWidget extends React.Component {
    constructor(props){
        super(props)
    }

    render(){
        return (
            <div className="widgetcontainer camera-widget">

                <div className="video-stream">
                    <div className="currentCamera">Current Camera</div>
                    <img src={cameraPreview} />
                </div>
                <div className="cameras">
                    <input type="text" className="search" placeHolder="Search Cameras"/>
                    <div className="camera">Camera 1</div>
                    <div className="camera">Camera 1</div>
                    <div className="camera">Camera 1</div>
                    <div className="camera">Camera 1</div>
                </div>
            </div>
        )
    }
}