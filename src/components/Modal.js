import React from "react";

export default class Modal extends React.Component {
    constructor(props){
        super(props)
    }



    render(){
        var display;
        if(this.props.modalIsOpen == true){
            display = {display: "block"}
        }
        else{
            display = {display: "none"}
        }
        return(
            <div className="modal fade bs-example-modal-lg in" tabIndex={-1} role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true" style={display}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <button type="button" className="close" data-dismiss="modal" onClick={this.props.close.bind(this)} aria-hidden="true">×</button>
                  <h5 className="modal-title" id="myLargeModalLabel">{this.props.modalTitle}</h5>
                </div>
                <div className="modal-body">
                  {this.props.modalBody}
                </div>
                <div className="modal-footer">
                  {this.props.modalFooter}
                </div>
              </div>
            </div>
          </div>
          
        )
    }



}