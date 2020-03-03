import React from 'react';

//REDUX
import store from "../store/store";
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {activateItem, addItems} from "../store/actions/index";
class Sidebar extends React.Component {
    constructor(props){
        super(props);
        
    }
    componentDidMount(){
    }

    UNSAFE_componentWillReceiveProps(nextProps){
        // console.log(nextProps.listitems)
        // this.props.addItems(nextProps.listitems);

    }


    componentDidUpdate(){
        // this.props.addItems(this.props.listitems);
    }
    filtering(filtereditem, event){
        this.props.filterBy(filtereditem)
        this.props.activateItem(filtereditem);        
    }


    render(){
        var state = this.props.sidebar;
        var active = state.active;
        var listitems = this.props.listitems;
        // console.log(listitems);
        var list = [];
        listitems.forEach((item)=>{
                // if(item.name == "Dashboard"){
                //     list.push(<li key={item.name} className="navigation-header">
                //                 {item.name}
                //                 <ul id="table_dr" className="collapse-level-1 two-col-list collapse in">
                //                     {item.items.map((subItem, index)=>{
                //                         // console.log(subItem)
                //                         return <li key={index}>{subItem}</li>
                //                     })}
                //                 </ul>
                //               </li>)
                // }else{
                //     list.push(<li key={item.name} className="navigation-header">{item.name}</li>);
                // }
                // console.log(item);

                if(item.name != null){
                    list.push(<li key={item.name} className="navigation-header">{item.name}</li>);
                        item.items.forEach((sub)=>{
                            // console.log(sub)
                            if(item.name == "Instances"){
                                list.push(<li key={sub} className="list-item" onClick={this.filtering.bind(this, sub)}><a><div className="pull-left"><span className="right-nav-text">{sub}</span></div></a></li>)
                            }else{
                                if(sub != active){
                                    list.push(<li key={sub.name} className="list-item" onClick={this.filtering.bind(this, sub.name)}><a><div className="pull-left"><span className="right-nav-text">{`${sub.name}`}</span></div></a></li>);
                                }
                                else{
                                    list.push(<li key={sub.name} className="list-item-active" onClick={this.filtering.bind(this, sub.name)}><a><div className="pull-left"><span className="right-nav-text">{`${sub.name}`}</span></div></a></li>);
                                }
                            }
                            
                        });
                        }
                
                list.push(<li><hr className="light-grey-hr mb-10" /></li>)
            });

        return(
            <div className="fixed-sidebar-left" >
                <div className="slimScrollDiv" style={{position: "relative", overflow: "hidden", width: "auto", height: "100%"}}>
                    <ul className="nav navbar-nav side-nav nicescroll-bar" style={{overflow: "hidden", width: "auto", height: "100%"}}>
                        {list}
                    </ul>
                    <div className="slimScrollBar" style={{background: "rgb(135, 135, 135)", width: "4px", position: "absolute", top: "2px", opacity: "0.4", display: "block", borderRadius: "0px", zIndex: "99", right: "1px", height: "95.2826px"}}></div>
                    <div className="slimScrollRail" style={{width: "4px", height: "100%", position:"absolute", top: "0px", display: "none", borderRadius: "7px", background: "rgb(51, 51, 51)", opacity:".2", zIndex: "90", right: "1px"}}></div>
                </div>
            </div>
        )
    }
}


const mapDispatchToProps = dispatch=>{
    return bindActionCreators({
        addItems: addItems,
        activateItem: activateItem
    }, dispatch);
}

const mapStateToProps = state=>{
    return {
        sidebar: state.sidebar
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);