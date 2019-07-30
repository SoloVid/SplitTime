dependsOn("/time/FrameStabilizer.js");

SplitTime.Debug = {
    ENABLED: true,
    DRAW_TRACES: true
};

var debugDiv = null;
var debugInfo;

SplitTime.Debug.attachDebug = function(parentId) {
    var parent = document.body;
    if(parentId) {
        parent = document.getElementById(parentId);
    }

    debugDiv = document.createElement("div");
    parent.appendChild(debugDiv);
};

var frameStabilizer = new SplitTime.FrameStabilizer(100);

SplitTime.Debug.update = function(info) {
    debugInfo = info;
    if(debugDiv === null || !frameStabilizer.isSignaling()) {
        return;
    }

    var table = "<table border='1'>";
    table += "<tr>";
    for(var key in info) {
        table += "<th>" + key + "</th>";
    }
    table += "</tr><tr>";
    for(key in info) {
        table += "<td>" + info[key] + "</td>";
    }
    table += "</tr>";
    table += "</table>";

    debugDiv.innerHTML = table;
};
