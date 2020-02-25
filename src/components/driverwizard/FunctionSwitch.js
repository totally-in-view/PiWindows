import React from "react";

export default function FunctionSwitch(props){
    return (
        <div className="bootstrap-switch bootstrap-switch-wrapper bootstrap-switch-id-check_box_switch bootstrap-switch-animate bootstrap-switch-on" style={{width: 118}}>
            <div className="bootstrap-switch-container" style={{width: 174, marginLeft: 0}}>
                <span className="bootstrap-switch-handle-on bootstrap-switch-primary" style={{width: 58}}>Variable</span>
                <span className="bootstrap-switch-label" style={{width: 58}}>&nbsp;</span>
                <span className="bootstrap-switch-handle-off bootstrap-switch-default" style={{width: 58}}>Text</span>
                <input id="check_box_switch" type="checkbox" data-off-text="False" data-on-text="True" className="bs-switch" />
            </div>
        </div>
    )
}