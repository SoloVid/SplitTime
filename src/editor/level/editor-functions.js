function setMode(name) { mode = name; }

function exportLevel() {
    var levelCopy = JSON.parse(JSON.stringify(levelObject));
    for(var iLayer = 0; iLayer < levelCopy.layers.length; iLayer++) {
        var layer = levelCopy.layers[iLayer];
        removeEditorProperties(layer);
    }
    for(var iTrace = 0; iTrace < levelCopy.traces.length; iTrace++) {
        removeEditorProperties(levelCopy.traces[iTrace]);
    }
    for(var iPos = 0; iPos < levelCopy.positions.length; iPos++) {
        removeEditorProperties(levelCopy.positions[iPos]);
    }
    for(var iProp = 0; iProp < levelCopy.props.length; iProp++) {
        removeEditorProperties(levelCopy.props[iProp]);
    }
    return JSON.stringify(levelCopy, null, 4);
}

function importLevel(levelText) {
    levelObject = JSON.parse(levelText);
    for(var iLayer = 0; iLayer < levelObject.layers.length; iLayer++) {
        var layer = levelObject.layers[iLayer];
        addEditorProperties(layer);
    }
    for(var iTrace = 0; iTrace < levelObject.traces.length; iTrace++) {
        addEditorProperties(levelObject.traces[iTrace]);
    }
    for(var iPos = 0; iPos < levelObject.positions.length; iPos++) {
        addEditorProperties(levelObject.positions[iPos]);
    }
    for(var iProp = 0; iProp < levelObject.props.length; iProp++) {
        addEditorProperties(levelObject.props[iProp]);
    }
    vueApp.level = levelObject;
}

function addEditorProperties(object) {
    object.displayed = true;
    object.isHighlighted = false;
}

function removeEditorProperties(object) {
    delete object.displayed;
    delete object.isHighlighted;
}

var DEFAULT_HEIGHT = 64;

function addNewLayer() {
    var assumedRelativeZ = DEFAULT_HEIGHT;
    if(levelObject.layers.length > 1) {
        assumedRelativeZ = Math.abs(levelObject.layers[1].z - levelObject.layers[0].z);
    }
    var z = 0;
    if(levelObject.layers.length > 0) {
        var previousLayer = levelObject.layers[levelObject.layers.length - 1];
        z = previousLayer.z + assumedRelativeZ;
    }
    levelObject.layers.push({
        displayed: true,
        id: "",
        z: z
    });
}

function addNewTrace(layerIndex, type) {
    var z = levelObject.layers[layerIndex].z;
    var height = levelObject.layers.length > layerIndex + 1 ?
        levelObject.layers[layerIndex + 1].z - z :
        DEFAULT_HEIGHT;
    if(type === splitTime.Trace.Type.GROUND) {
        type = splitTime.Trace.Type.SOLID;
        height = 0;
    }
    var trace = {
        type: type,
        vertices: "",
        z: z,
        height: height
    };
    addEditorProperties(trace);
    levelObject.traces.push(trace);
    return trace;
}

function imgSrc(fileName) {
    if(!fileName) {
        return "";
    }
    return projectPath + splitTime.IMAGE_DIR + "/" + fileName;
}

function safeGetColor(trace) {
    if(trace.isHighlighted) {
        return "rgba(255, 255, 0, 0.8)";
    }
    var type = trace.type;
    if(type === splitTime.Trace.Type.SOLID && +trace.height === 0) {
        type = splitTime.Trace.Type.GROUND;
    }
    for(var i = 0; i < vueApp.traceOptions.length; i++) {
        if(vueApp.traceOptions[i].type === type) {
            return vueApp.traceOptions[i].color;
        }
    }
    return "rgba(255, 255, 255, 1)";
}
function safeExtractTraceArray(traceStr) {
    var normalizedTraceStr = normalizeTraceStr(traceStr);
    return splitTime.Trace.extractArray(normalizedTraceStr);
}

function normalizeTraceStr(traceStr) {
    return traceStr.replace(/\(pos:(.+?)\)/g, function(match, posId) {
        var position = null;
        for(var i = 0; i < levelObject.positions.length; i++) {
            if(levelObject.positions[i].id === posId) {
                position = levelObject.positions[i];
            }
        }

        if(!position) {
            console.warn("Position (" + posId + ") undefined in trace string \"" + traceStr + "\"");
            return "";
        }

        return "(" + position.x + ", " + position.y + ")";
    });
}

function findClosestPosition(x, y) {
    var closestDistance = Number.MAX_SAFE_INTEGER;
    var closestPosition = null;

    levelObject.positions.forEach(function(pos) {
        var dx = pos.x - x;
        var dy = pos.y - y;
        var dist = Math.sqrt((dx * dx) + (dy * dy));
        if(dist < closestDistance) {
            closestDistance = dist;
            closestPosition = pos;
        }
    });

    return closestPosition;
}

function moveFollower(dx, dy) {
    var toMove = follower || lastFollower;
    if(!toMove) {
        return;
    }
    if(toMove.trace !== undefined) {
        var trace = toMove.trace;
        var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g;
        if (toMove.point) {
            regex = new RegExp("\\((" + toMove.point.x + "),\\s*(" + toMove.point.y + ")\\)", "g");
            toMove.point = {
                x: toMove.point.x + dx,
                y: toMove.point.y + dy,
                z: toMove.point.z,
            };
        }
        var pointString = trace.vertices;
        trace.vertices = pointString.replace(regex, function(match, p1, p2) {
            var newX = Number(p1) + dx;
            var newY = Number(p2) + dy;
            return "(" + newX + ", " + newY + ")";
        });
    } else {
        toMove.x += dx;
        toMove.y += dy;
    }
}

function updatePageTitle() {
    var title = fileName ? fileName : "untitled";
    if (levelObject.region) {
        title += " (" + levelObject.region + ")";
    }
    document.title = title;
}

function clickFileChooser() {
    $("#fileChooser").click();
}

function downloadFile() {
    var jsonText = exportLevel();

    fileName = prompt("File name?", fileName);
    if(!fileName) {
        return;
    }
    if(!fileName.endsWith(".json")) {
        fileName += ".json";
    }

    updatePageTitle();

    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonText));
    pom.setAttribute('download', fileName);

    pom.style.display = 'none';
    document.body.appendChild(pom);

    pom.click();

    document.body.removeChild(pom);
}

function getPixelsPerPixel() {
    return levelObject.type === "TRPG" ? 32 : 1;
}

function createLevel(type) {
    if(levelObject.layers.length > 0) {
        if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
            return;
        }
    }

    if(!type) {
        // type = prompt("Type: (action/overworld)");
        type = "action";
    }

    levelObject = {
        region: "",
        width: 640,
        height: 480,
        background: "",
        backgroundOffsetX: 0,
        backgroundOffsetY: 0,
        type: type,
        layers: [],
        traces: [],
        positions: [],
        props: []
    };

    vueApp.level = levelObject;
    vueApp.createLayer();

    $("#editorTools").show();

    updatePageTitle();
}

function createObject(type)  {
    var layerIndex = vueApp.activeLayer;
    var z = levelObject.layers[layerIndex].z;
    var x = mouseLevelX;
    var y = mouseLevelY + z;

    var object = {
        id: "",
        template: "",
        x: x,
        y: y,
        z: z,
        dir: 3,
        stance: "default"
    };

    addEditorProperties(object);

    if(type == "position") {
        levelObject.positions.push(object);
        showEditorPosition(object);
    } else if(type == "prop") {
        levelObject.props.push(object);
        showEditorProp(object);
    }
}

function loadBodyFromTemplate(templateName) {
    try {
        return G.BODY_TEMPLATES.getInstance(templateName);
    } catch(e) {
        return new splitTime.Body();
    }
}

function getBodyImage(body) {
    if(body.drawable instanceof splitTime.Sprite) {
        return imgSrc(body.drawable.img);
    }
    return subImg;
}

function getAnimationFrameCrop(body, dir, stance) {
    if(body.drawable instanceof splitTime.Sprite) {
        return body.drawable.getAnimationFrameCrop(splitTime.direction.interpret(dir), stance, 0);
    }
    // FTODO: more solid default
    return {
        xres: 32,
        yres: 64,
        sx: 0,
        sy: 0
    };
}

function getSpriteOffset(body) {
    if(body.drawable instanceof splitTime.Sprite) {
        return {
            x: body.drawable.baseOffX,
            y: body.drawable.baseOffY
        };
    }
    return { x: 0, y: 0 };
}
