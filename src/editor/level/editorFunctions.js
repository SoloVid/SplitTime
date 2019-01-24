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

function importLevel(levelObject) {
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
    return JSON.stringify(levelObject);
}

function addEditorProperties(object) {
    object.displayed = true;
    object.isHighlighted = false;
}

function removeEditorProperties(object) {
    delete object.displayed;
    delete object.isHighlighted;
}

function imgSrc(fileName) {
    if(!fileName) {
        return "";
    }
    return projectPath + SplitTime.location.images + fileName;
}

function safeGetColor(trace) {
    // if(!window.SplitTime) {
    //     return [];
    // }
    // return SplitTime.Trace.getColor(type);
    if(trace.isHighlighted) {
        return traceEditorColors["highlight"];
    }
    return traceEditorColors[trace.type];
}
function safeExtractTraceArray(traceStr) {
    // if(!window.SplitTime) {
    //     return [];
    // }
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

function loadFile2(data) {
	console.log(data);

	levelObject = JSON.parse(data);

	$("#editorTools").show();
}

function downloadFile() {
	var jsonText = JSON.stringify(levelObject, null, 4);

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

	if(layerWidth > vueApp.levelWidth || layerHeight > vueApp.levelHeight)
	{
		vueApp.levelWidth = layerWidth;
		vueApp.levelHeight = layerHeight;
		// resizeBoard(layerWidth, layerHeight);
	}
}

function getPixelsPerPixel() {
	return levelObject.type === "TRPG" ? 32 : 1;
}

function helpXML() {
	var msg = "";
	msg += "In this part of the editor, you can hard code aspects of the item in question.\n";
	msg += "Important variables to assign are x, y, and layer.\n";
	msg += "Second to these, you should have dir, img, xres, and yres assigned. However, you may choose to use a template for these.\n";
	msg += "In the template box, you may put a filename for a .txt file which assigns these variables. This file must be in the same folder as this application.\n\n";
	msg += "Traces are probably one of the more confusing things. When you edit the specifics of a trace, it is probably best to only touch the 'template.' ";
	msg += "The template of a trace is the color of the trace. This color tells the engine how the player should interact with the trace. ";
	msg += "Basically, rgb(255, 0, 0) is solid (like a wall), rgb(255, 255, 0) is open air (i.e. player cannot walk here, but projectiles can traverse it), ";
	msg += "and rgb(100, __, __) triggers a board program. The second blank is just the number of the board program to be run. The first blank is the condition upon which the program is run.\n";
	msg += "- 0 means that any character triggers the program every pixel they travel. This should only really be used for traces that are 1 pixel (e.g. in TRPG) or small graphic adjustments or sound effects.\n";
	msg += "- 1 means that a player character may trigger the program the first time they step on it. After the player steps off of the trace, it may be triggered again.\n";
	msg += "- 2 means that a player character may trigger the program if ENTER or SPACE is pressed while on the trace.\n";

	alert(msg);
}

function createLevel(type) {
	if(!type) {
        type = prompt("Type: (action/overworld)");
	}

	levelObject = {
		type: type,
		layers: [],
		positions: [],
		props: []
	};

	vueApp.createLayer();

	$("#editorTools").show();
}

function createObject(type)  {
	// var positionContainer = $('<div id="' + (type + index) + '" class="draggable ' + type + '"></div>');
	// positionContainer.css("position", "absolute");
	// positionContainer.css("overflow", "hidden");
    //
	// var displayNPC = $('<img />');
	// displayNPC.css("position", "absolute");
	// positionContainer.append(displayNPC);

	var x = mouseLevelX;
	var y = mouseLevelY;
	var layer = $("#activeLayer").val();

	var node = {
        id: "",
        x: x,
        y: y,
        layer: layer,
        dir: 3,
        stance: "default"
    };

	if(type == "position") {
		levelObject.positions.push(node);
		showEditorPosition(node);
	} else if(type == "prop") {
		levelObject.props.push(node);
		showEditorProp(node);
	}
}

function loadBodyFromTemplate(templateName) {
	var bodyInstance = SplitTime.Body.getTemplateInstance(templateName);
	if(!bodyInstance) {
		return new SplitTime.Body();
	}
	return bodyInstance;
}
