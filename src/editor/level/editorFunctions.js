function setMode(name) { mode = name; }

function exportLevel() {
	var levelCopy = JSON.parse(JSON.stringify(levelObject));
	for(var iLayer = 0; iLayer < levelCopy.layers.length; iLayer++) {
		var layer = levelCopy.layers[iLayer];
		removeEditorProperties(layer);
		for(var iTrace = 0; iTrace < layer.traces.length; iTrace++) {
			removeEditorProperties(layer.traces[iTrace]);
		}
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
        for(var iTrace = 0; iTrace < layer.traces.length; iTrace++) {
            addEditorProperties(layer.traces[iTrace]);
        }
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

function addNewLayer() {
	var assumedRelativeHeight = 64;
	if(levelObject.layers.length > 1) {
		assumedRelativeHeight = Math.abs(levelObject.layers[1].height - levelObject.layers[0].height);
	}
    var height = 0;
    if(levelObject.layers.length > 0) {
        var previousLayer = levelObject.layers[levelObject.layers.length - 1];
        height = previousLayer.height + assumedRelativeHeight;
    }
    levelObject.layers.push({
        displayed: true,
		id: "",
        background: "",
        height: height,
        traces: []
    });
}

function addNewTrace(layerIndex) {
	var trace = {
		type: "",
		vertices: "",
		parameter: ""
	};
	addEditorProperties(trace);
	levelObject.layers[layerIndex].traces.push(trace);
	return trace;
}

function imgSrc(fileName) {
    if(!fileName) {
        return "";
    }
    return projectPath + SplitTime.location.images + fileName;
}

function safeGetColor(trace) {
    if(trace.isHighlighted) {
        return traceEditorColors["highlight"];
    }
    return traceEditorColors[trace.type];
}
function safeExtractTraceArray(traceStr) {
    var normalizedTraceStr = normalizeTraceStr(traceStr);
    return SplitTime.Trace.extractArray(normalizedTraceStr);
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

function clickFileChooser() {
	$("#fileChooser").click();
}

function downloadFile() {
	var jsonText = exportLevel();

	var filename = prompt("File name?");
	if(!filename.endsWith(".json")) {
		filename += ".json";
	}

	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonText));
	pom.setAttribute('download', filename);

	pom.style.display = 'none';
	document.body.appendChild(pom);

	pom.click();

	document.body.removeChild(pom);
}

function resizeBoardCheck(imgEl) {
	var layerWidth = imgEl.width;
	var layerHeight = imgEl.height;

	if(layerWidth > vueApp.levelWidth || layerHeight > vueApp.levelHeight) {
		vueApp.levelWidth = layerWidth;
		vueApp.levelHeight = layerHeight;
	}
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
		type: type,
		layers: [],
		positions: [],
		props: []
	};

	vueApp.level = levelObject;
	vueApp.createLayer();

	$("#editorTools").show();
}

function createObject(type)  {
	var x = mouseLevelX;
	var y = mouseLevelY;
	var layerIndex = vueApp.activeLayer;
	var z = levelObject.layers[layerIndex].height;

	var object = {
        id: "",
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
        object.template = "";
		levelObject.props.push(object);
		showEditorProp(object);
	}
}

function loadBodyFromTemplate(templateName) {
	var bodyInstance = SplitTime.Body.getTemplateInstance(templateName);
	if(!bodyInstance) {
		return new SplitTime.Body();
	}
	return bodyInstance;
}
