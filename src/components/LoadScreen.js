import React from "react";

export default class LoadScreen extends React.Component {
    constructor(props){
        super(props)
    }



    render(){
        return(
            <div className="modal fade bs-example-modal-lg in" tabIndex={-1} role="dialog" aria-labelledby="myLargeModalLabel" style={{display: "block"}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{height: "300px", display: "flex", flexFlow: "column", justifyContent: "center"}}>
                <div className="modal-body" style={{display: "flex", justifyContent: "center"}}>
                  <i style={{fontSize: "150px"}}className="fa fa-spin fa-spinner"></i>
                </div>
              </div>
            </div>
          </div>
          
        )
    }



}