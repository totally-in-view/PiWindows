import React from "react";
import ReactDOM from "react-dom";
import LightingWidget from "./widgets/LightingWidget";
import HVACWidget from "./widgets/HVACWidget";
import {ClientAccordion} from "./ClientAccordion.js";
import Scene from "./widgets/Scene";
import Modal from "./Modal";
import {Index} from "./client/widgets/index";
export default class Canvas extends React.Component {
    constructor(props){
        super(props)
        this.canvas = React.createRef();
        var tree = new Map();
        var canvasDoc = document.implementation.createDocument("", "", null);
        var template = this.props.template.body;
        var root = canvasDoc.createElement(template.tag);
        
        for(var prop in template.attributes){
            root.setAttribute(prop, template.attributes[prop]);
        }
        root.setAttribute("children", template.children);
        canvasDoc.appendChild(root);
        console.log(canvasDoc);
        tree.set("canvas", []);
        this.state = {
            sidebarState: "Home",
            currentView: template.attributes.id,
            currentNode: root,
            views: tree,
            accordionState: "hidden",
            template: template,
            canvasDoc: canvasDoc,
            widgetWindowOpen: false,
            widgetType: "",
            widgetSpecialProps: {},
            widgets: Index
        }
    }

    componentDidUpdate(){
        this.canvasDocToJSX()
    }
    
    componentDidMount(){
        
    }

    guid(){
        return "ss-s-s-s-sss".replace(/s/g, this.s4())
    }
    s4(){
        return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1); 
    }

    selectContainer(uuid, parent = null, event){
        var node;
        if(parent != null){
            node = this.state.canvasDoc.getElementById(parent);
        }else{
            node = this.state.canvasDoc.getElementById(uuid);
        }
        this.setState({
            currentNode: node,
            currentView: uuid
        })
    }

    toHomeSideBar(){
        this.setState({
            sidebarState: "Home" 
        })
    }
    toHeaderSideBar(){
        this.setState({
            sidebarState: "Header"
        })
    }

    toSideBarSideBar(){
        this.setState({
            sidebarState: "Sidebar"
        })
    }
    toBodySideBar(){
         this.setState({
                sidebarState: "Body",
        })
                
    }
    toFooterSideBar(){
        this.setState({
            sidebarState: "Footer"
        })
    }

    addNewWidget(){
        this.setState({
            widgetWindowOpen: true
        })
    }
    addRow(){
        var uuid = this.guid();
        var views = this.state.views;
        var row;
        var view = views.get(this.state.currentView);
        console.log(view);
        row = <div onClick={this.selectContainer.bind(this, uuid)} key={uuid} id={uuid} className="canvas-row"></div>
        view.push(row);
        views.set(this.state.currentView, view);
        ReactDOM.render(<div className="canvas-container-row">{view}</div>, document.getElementById(this.state.currentView));
                
        views.set(uuid, []);
        this.setState({
            views: views
        })
    }
   
    addColumn(){
        var uuid = this.guid();
        var column = <div onClick={this.selectContainer.bind(this, uuid)} key={uuid} id={uuid} className="canvas-column"></div>
        var views = this.state.views;
        var view = this.state.views.get(this.state.currentView);

        view.push(column);
        views.set(this.state.currentView, view);
        views.set(uuid, []);

        ReactDOM.render(<div className="canvas-container-column">{view}</div>, document.getElementById(this.state.currentView))
        this.setState({
            views: views
        })
    }

    addAccordion(){
        if(this.state.accordionState == "hidden"){
            var views = this.state.views;
            // var doc = this.state.canvasDoc;
            var uuid = this.guid();
            // var parent = doc.getElementById(this.state.currentView);
            // var el = doc.createElement("ClientAccordion");
            //     el.setAttribute("id", uuid);
            // parent.appendChild(el);
            // var serializer = new XMLSerializer();
            // console.log(doc)
            views.set(uuid, {type: "accordion", info: []})
            this.setState({
                accordionState: "shown",
                currentView: uuid,
                views: views
            })
        }
        else if(this.state.accordionState == "shown"){
            this.setState({
                accordionState: "hidden"
            })
        }
        
    }

    addAccordionTab(){
        var accordion = this.state.views.get(this.state.currentView);

        accordion.info.push({active:false, name: "Tab", body: [], widgetsRight: [], widgetsLeft: [], accordionUUID: this.state.currentView})

        var views = this.state.views;

        views.set(this.state.currentView, accordion);

        this.setState({
            views: views

        })
    }

    editTabName(uuid,pos,tabName){
        // console.log(uuid, pos, tabName);
        var doc = this.state.canvasDoc;
        var accordion = doc.getElementById(uuid);
        console.log(accordion);
        var tabs = JSON.parse(accordion.getAttribute("info"))
        tabs[pos].name = tabName;

        accordion.setAttribute("info", JSON.stringify(tabs));

        this.setState({
            canvasDoc: doc,
            currentNode: accordion
        })

    }

    toTab(uuid, pos){
        // var views = this.state.views;
        // var accordion = views.get(uuid);
        // for(var i = 0; i < accordion.info.length; i++){
            
        //     if(pos == i){
        //         accordion.info[i].active = true
        //     }else{
        //         accordion.info[i].active = false
        //     }
        // }
        // views.set(uuid, accordion); 
        // this.setState({
        //     views: views
        // })
    }
    
    addAccordionBody(body = null){
        var uuid = this.state.currentView;
        var node = this.state.currentNode;
        var parent = node.parentNode;
        var tabs = JSON.parse(node.getAttribute("info"));

        tabs.forEach((tab)=>{
            if(tab.id == uuid){
                tab.body.push(<div>Hello World</div>);
            }
        });
        node.setAttribute("info", JSON.stringify(tabs));
        parent.replaceChild(node, this.state.currentNode);


        this.setState({
            currentNode: node
        })
    }
    canvasHTML(node) {
        console.log(typeof node);
        var tag,
            attributes = [],
            canvasEditorProps = {};
        if(node.getAttributeNames != null){
            if(node.tagName != "div"){
                tag = this.props.docTagToClass[node.tagName];
            }
            else{
            tag = node.tagName
            }
            attributes = node.getAttributeNames()
        }
            var children = [],
            attr = {};
        for(var i = 0; i < attributes.length; i++){
            var attribute = attributes[i];
            if(attribute == "class" || attribute == "id"){
                attr[attribute] = node.getAttribute(attribute);
                if(attribute == "id"){
                    var id = node.getAttribute(attribute);
                }
            }
           else if(attribute != "class" && attribute != "id" && attribute != "children"){
               attr[attribute] = JSON.parse(node.getAttribute(attribute));
           }
        }
        console.log(tag, attr, children);
        
        var childrenNodes = node.childNodes;
        console.log(childrenNodes)
        if(childrenNodes.length > 0){
        childrenNodes.forEach((node)=>{
            var child = this.canvasHTML(node);
            children.push(child);
        });
    }   
        if(node.tagName == "ClientAccordion"){
            canvasEditorProps = {
                changeTabName: this.editTabName.bind(this),
                toTab:this.toTab.bind(this)
            }
        }
        // console.log(tag, attr, children);
        var element = React.createElement(tag, {...attr, ...canvasEditorProps}, children);
        return element; 
    }

    changeWidgetType(event){
        this.setState({
            widgetType: event.target.value
        })
    }

    addWidgetToDocument(widget){
        var canvasDoc = this.state.canvasDoc
        var parent = canvasDoc.getElementById(this.state.currentView);
        var element = canvasDoc.createElement(widget.tag);
        for(var prop in widget.attributes){
            element.setAttribute(prop, widget.attributes[prop])
        }
        // element.setAttribute("children", []);
        parent.appendChild(element)
        var doc = canvasDoc,
            all = doc.getElementsByTagName("*"),
            root = all[0];

        this.setState({
            template: this.canvasDocToJXON(root),
            canvasDoc: canvasDoc,
            widgetSpecialProps: {},
            widgetType: "",
            widgetWindowOpen: false
        })
    }

    saveWidget(){
        var tag = ""
        var className ="";
        var specialProps =  {};
        var id = this.guid();
        if(this.state.widgetType == "Column"){
            tag = "div"
            className="col"
        } else if(this.state.widgetType == "Row"){
            tag = "div"
            className="row"
        }
        else if(this.state.widgetType == "ClientAccordion"){
            tag = this.state.widgetType;
            specialProps = this.state.widgetSpecialProps;
            for(var i = 0; i < specialProps.info.length; i++){
                specialProps.info[i]["parentId"] = id; 
            }

            specialProps.info = JSON.stringify(this.state.widgetSpecialProps.info);
            console.log(specialProps)
        }
        else{
            tag = this.state.widgetType;
        }

        var widget = {
            tag: tag,
            attributes: {
                class: className,
                id: id,
                ...specialProps
            }
        }
        this.addWidgetToDocument(widget)
    }

    addTabs(event){
        var tabs = [];

        for(var i = 0; i < event.target.value; i++){
            tabs.push({
                name: "Tab",
                body: [],
                active: false,
                id: this.guid()
            });
        }
        this.setState({
            widgetSpecialProps: {info: tabs}
        })

    }

    canvasDocToJXON(node){
        var tag,
            attributes = [];
        if(node.getAttributeNames != null){
            tag = node.tagName
            attributes = node.getAttributeNames()
        }
            var children = [],
            attr = {};
        for(var i = 0; i < attributes.length; i++){
            var attribute = attributes[i];
            attr[attribute] = node.getAttribute(attribute);
        }
        var childrenNodes = node.childNodes;
        if(childrenNodes.length > 0){
        childrenNodes.forEach((node)=>{
            var child = this.canvasDocToJXON(node);
            children.push(child);
        });
    }
        // console.log(tag, attr, children);
        var element = {
            tag: tag, 
            attributes: attr,
            children: children
        };
        return element;
    }

    canvasDocToJSX(){
        var canvasDoc = this.state.canvasDoc,
            all = canvasDoc.getElementsByTagName("*"),
            root = all[0];
            var canvasRoot = this.canvasHTML(root);
            console.log(canvasRoot);
            ReactDOM.render(canvasRoot, document.getElementById("canvas"))
    }

    flattenTree(node){
        var treeUi = [];
        var id;
        console.log(node)
        treeUi.push(<div className="canvas-option" key={node.attributes.id} onClick={this.selectContainer.bind(this, node.attributes.id, null)}>{node.tag}</div>)
        
        if(node.tag == "ClientAccordion"){
            var tabs = JSON.parse(node.attributes.info)
            // treeUi.push(<div className="canvas-option" key={node.attributes.id} onClick={this.selectContainer.bind(this, node.attributes.id, null)}>{node.tag}</div>)
            tabs.forEach((tab)=>{
                treeUi.push(<div className="canvas-option" key={tab.id} onClick={this.selectContainer.bind(this, tab.id, tab.parentId)}>{tab.name}</div>)
            })
        }

        if(node.children.length > 0){
            node.children.forEach((child)=>{
                treeUi = treeUi.concat(this.flattenTree(child));
            })
        }
        return treeUi;
    }

    saveTemplate(template){
        // console.log(template);
        this.props.socket.emit("create-template", template);
    }

    render(){   
        var widgetSelection = [];
        var widgetSpecifics;
        for(var prop in this.state.widgets){
            widgetSelection.push(<option>{prop}</option>);
        }

        if(this.state.widgetType == "ClientAccordion"){
            widgetSpecifics =   <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="control-label mb-10 text-left">
                                            number of tabs
                                        </label>
                                        <input type="number" className="form-control" onChange={this.addTabs.bind(this)} />
                                    </div>
                                </div>

        }
        var sidebar;


        switch(this.state.sidebarState){
            case "Home":
                sidebar = [<div className="canvas-option" onClick={this.toHeaderSideBar.bind(this)}>Header</div>,<div className="canvas-option" onClick={this.toSideBarSideBar.bind(this)}>Sidebar</div>, <div className="canvas-option" onClick={this.toBodySideBar.bind(this)}>Body</div>, <div className="canvas-option">Footer</div>]
                break;
            case "Header":
                sidebar =  [<div className="canvas-option">Add Logo</div>, <div className="canvas-option">Add Text</div>]
                break;
            case "Sidebar":
                sidebar = [<div className="canvas-option">Add Navigation</div>]
                break;
            case "Body":
                var all = this.state.canvasDoc.getElementsByTagName("*"),
                root = all[0];
                var template = this.canvasDocToJXON(root)
                var treeOptions = this.flattenTree(template);
                sidebar = [
                    <div className="canvas-option" onClick={this.addNewWidget.bind(this)}>Add Widget</div>,
                    <div className="canvas-option">Add Devices by Area</div>,
                    <div className="canvas-option">Add Devices by Type</div>,
                    <div className="canvas-option">Add Scenes</div>,
                    <div className="canvas-option" onClick={this.addAccordionBody.bind(this)}>Add Body to Tab</div>
                ]
                sidebar.push(treeOptions);
                break;
            case "Footer":
                sidebar = [];
                break;
            
            default:
                break;
        }
        // this.state.views.forEach((value, key, map)=>{
        //     var selected = {};
        //     if(key == this.state.currentView){
        //         selected = {outlineStyle: "solid", outlineColor: "#f00"};
        //     }
        //     if(value.type == "accordion"){
        //         for(var i = 0; i < value.info.length; i++){
        //             var tab = value.info[i];
        //             accordionTabs.push(<div onClick={this.toTab.bind(this, tab.accordionUUID, i)}>{tab.name}</div>)
        //         }

        //         UI.push(<div style={selected}><ClientAccordion changeTabName={this.editTabName.bind(this)} toTab={this.toTab.bind(this)} onClick={this.selectContainer.bind(this, key)} info={value.info}/></div>)
        //     }
        // })
        return (
            <div className="canvas-module">
                <div className="canvas-sidebar">
                    <Modal modalIsOpen={this.state.widgetWindowOpen} modalTitle={"Widget"} modalBody={
                        <div>
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="control-label mb-10 text-left">
                                            widget type
                                        </label>
                                        <select onChange={this.changeWidgetType.bind(this)} className="form-control" value={this.state.widgetType}>
                                        <option></option>
                                            {widgetSelection}
                                        </select>
                                    </div>
                                </div>
                                {widgetSpecifics}
                            </div>

                        </div>
                    } modalFooter={<button className="btn btn-success" onClick={this.saveWidget.bind(this)}>Save</button>} close={()=>{
                        this.setState({
                            widgetWindowOpen: false
                        });
                    }}/>
                    <div className="canvas-options">
                        {sidebar}
                    </div>
                    <div className="canvas-footer">
                    <div onClick={this.toHomeSideBar.bind(this)} className="canvas-option ">Home</div>
                    <div onClick={this.saveTemplate.bind(this, "")} className="canvas-option">Save</div>
                    </div>
                </div>
                <div ref={this.canvas} id="canvas" className="canvas">
                </div>
            </div>
        )
    }
}

Canvas.defaultProps = {
    template: {
        header: {
            tag: "TemplateHeader",
            attributes: {
                class: "templateHeader",
                id: "tHeader"
            },
            children: []
        },
        sidebar: {
            tag: "TemplateSidebar",
            attributes: {
                class: "templateSidebar",
                id: "tSidebar"
            },
            children: []
        },
        body: {
            tag: "div",
            attributes: {
                class: "templateRoot",
                id: "tRoot"
            },
            children: []
        },
        footer: {
            tag: "TemplateFooter",
            attributes: {
                class: "templateFooter",
                id: "tFooter"
            },
            children: []
        }
    },
    widgets: [
        "ClientAccordion",
    ],

    docTagToClass: {
        "ClientAccordion": ClientAccordion

    },

    sidebar: {
        home: [],
        header: [],
        sidebar: [],
        body: [],
        footer: []
    }
}