var projectPath = "projects/" + (window.location.hash.substring(1) || prompt("project folder name:")) + "/";

var script = document.createElement("script");
script.setAttribute("id", "staticScript");
script.setAttribute("src", projectPath + "dist/static.js");

var thisScript = document.scripts[document.scripts.length - 1];
var parent = thisScript.parentElement;
parent.insertBefore(script, thisScript.nextSibling);
