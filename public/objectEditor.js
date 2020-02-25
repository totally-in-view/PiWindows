let fs = require("fs");
let path = require("path");
let file = JSON.parse(fs.readFileSync(path.join(__dirname, "file.json")));

console.log(file);