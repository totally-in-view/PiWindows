let electron = require("electron");
let Menu = electron.Menu;

let menuTemplate = [
    {
        label: "Pinnacle Integrations",
        submenu:[
            {
                role:"close"
            },
            {
                role: "quit"
            }
        ]
    },
    {
        label: "File",
        submenu: [
            {
                label: "Open",
                accelerator: "CmdorCtrl+O"
            },
            {
                label: "Compare",
                accelerator: "CmdorCtrl+Shift+C"
            },
            {
                label: "Save",
                accelerator: "CmdorCtrl+S"
            },
            {
                label: "Backup",
                accelerator: "CmdorCtrl+Shift+B"
            },
        ]
    },
    {
        label: "Edit",
        submenu: [
            {role: "undo"},
            {role: "redo"},
            {role: "cut"},
            {role: "copy"},
            {role: "paste"},
            {role: "selectall"}
        ]
    },
    {
        label: "Maintenance",
        submenu: [
            {role: "reload"},
            {role: "forcereload"},
            {
                label: "Restart Services",
                accelerator: "CmdorCtrl+Shift+R"
            },
            {
                label: "Update Systems",
                accelerator: "CmdorCtrl+Shift+U"
            },
            {
                label: "Database",
                accelerator: "CmdorCtrl+Shift+D"
            },
            {
                label: "Purge Logger",
                accelerator: "CmdorCtrl+Shift+P"
            },
            {
                label: "Object Editor",
                accelerator: "CmdorCtrl+Shift+O"
            },
            {
                label: "Instance Editor",
                accelerator: "CmdorCtrl+Shift+I"
            },
            {
                label: "Clean Database"
            },
            {
                label: "Update"
            },
            {
                label: "Whitelist",
                accelerator: "CmdorCtrl+Shift+W"
            },
            {
                label: "Ports",
                
            },
        ]
    },
    {
        label: "Help",
        submenu: [
            {
                label: "Version"
            },
            {
                label: "Client"
            },
            {
                label: "Server"
            },
            {
                label: "API"
            },
        ]
    }
]

let myAppMenu = Menu.buildFromTemplate(menuTemplate);

exports.module = myAppMenu 