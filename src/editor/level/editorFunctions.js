function setMode(name) { mode = name; }

function normalizeTraceStr(traceStr) {
	return traceStr.replace(/\(pos:(.+?)\)/g, function(match, posId) {
		var position = $levelXML.find("position[id='" + posId + "']");

		if(position.length === 0) {
			console.warn("Position (" + posId + ") undefined in trace string \"" + traceStr + "\"");
			return "";
		}

		var x = position.attr("x");
		var y = position.attr("y");
		return "(" + x + ", " + y + ")";
	});
}

function drawTraces(highlightIndex, drawTo, drawFromBackup, findX, findY) {
	if(!$levelXML) return;
	var ignoreHighlighted = false;
	if(!drawTo)
	{
		drawTo = "whiteboard";
	}
	else
	{
		ignoreHighlighted = true;
	}

	var retVal = -1;

	// var XMLLayers = levelXML.getElementsByTagName("layer");
	var XMLLayers = $levelXML.find("layer");

	// var cnvLayers = document.getElementsByClassName(drawTo);
	var cnvLayers = $("." + drawTo);
	var absoluteTraceIndex = 0;

	// for(var i = 0; i < XMLLayers.length; i++)
	// {
	XMLLayers.each(function(i) {
		// var layerTraces = XMLLayers[i].getElementsByTagName("trace");
		var layerTraces = $(this).find("trace");

		// var ctx = cnvLayers[i].getContext("2d");
		var ctx = cnvLayers.get(i).getContext("2d");

		ctx.clearRect(window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20);
		//ctx.clearRect(0, 0, cnvLayers[i].width, cnvLayers[i].height);

		ctx.translate(0.5, 0.5);

		// for(var j = 0; j < layerTraces.length; j++)
		// {
		layerTraces.each(function() {
			// var color = layerTraces[j].getAttribute("template");
			var traceType = $(this).attr("type");
			var color = traceEditorColors[traceType];
			if(highlightIndex !== undefined && highlightIndex == absoluteTraceIndex)
			{
				if(ignoreHighlighted)
				{
					absoluteTraceIndex++;
					return true;
				}
				color = traceEditorColors["highlight"];
			}

			var traceStr = normalizeTraceStr($(this).text());
			SplitTime.Trace.drawColor(traceStr, ctx, color);

			if(findX && findY) {
				var imgData = ctx.getImageData(findX, findY, 1, 1);
				if(imgData.data[3] !== 0)
				{
					retVal = absoluteTraceIndex;
					return false;
				}
			}

			absoluteTraceIndex++;
		});
		ctx.translate(-0.5, -0.5);
	});
	if(findX && findY) {
		return retVal;
	}
}

function drawTracesFromBackup(highlightIndex) {
	// var XMLLayers = levelXML.getElementsByTagName("layer");
	var XMLLayers = $levelXML.find("layer");
	var ctx;
	// var cnvLayers = document.getElementsByClassName("whiteboard");
	// var backupLayers = document.getElementsByClassName("backupCanv");
	var cnvLayers = $(".whiteboard");
	var backupLayers = $(".backupCanv");

	var i;

	// for(i = 0; i < XMLLayers.length; i++)
	// {
	XMLLayers.each(function(index) {
		i = index;
		ctx = cnvLayers.get(i).getContext("2d");

		ctx.clearRect(window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20);

		ctx.drawImage(backupLayers.get(i), window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20, window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20);
	});

	i--;

	// var highlightTrace = levelXML.getElementsByTagName("trace")[highlightIndex];
	var highlightTrace = $levelXML.find("trace:eq(" + highlightIndex + ")");

	ctx = cnvLayers.get(i).getContext("2d");

	ctx.translate(0.5, 0.5);

	var traceStr = normalizeTraceStr(highlightTrace.text());
	SplitTime.Trace.drawColor(traceStr, ctx, traceEditorColors["highlight"]);

	ctx.translate(-0.5, -0.5);
}

function findTrace(x, y) {
	return drawTraces(-1, "whiteboard", false, x, y);
}

function findClosestPosition(x, y) {
	var closestDistance = Number.MAX_SAFE_INTEGER;
	var closestPosition = null;

	$levelXML.find("position").each(function() {
		var posX = $(this).attr("x");
		var posY = $(this).attr("y");
		var dx = posX - x;
		var dy = posY - y;
		var dist = Math.sqrt((dx * dx) + (dy * dy));
		if(dist < closestDistance) {
			closestDistance = dist;
			closestPosition = $(this).attr("id");
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

	$("#layers").empty();

	var layers = $levelXML.find("background");

	layers.each(function() {
		createLayer(projectPath + "images/" + $(this).text(), true);
	});

	$levelXML.find("position").each(function(i) {
		createObject("position", true, i);
	});
	$levelXML.find("prop").each(function(i) {
		createObject("prop", true, i);
	});

	generateLayerMenu();
	drawTraces();

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

	if(layerWidth > BOARDX || layerHeight > BOARDY)
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

function updateObject(type, index) {
	if(type === undefined) type = typeSelected;
	if(index === undefined) index = indexSelected;

	XMLNode = $levelXML.find(type + ":eq(" + index + ")");
	HTMLNode = $("#" + type + index);
	HTMLImg = HTMLNode.find("img");

	var t;
	if(type == "prop") {
		t = loadBodyFromTemplate(XMLNode.attr("template"));
	}
	else if(type == "position") {
		t = SplitTime.Actor[XMLNode.find("alias").attr("actor")] || loadBodyFromTemplate();
	}

	var layer = XMLNode.attr("layer");
	var img = t.img ? projectPath + SplitTime.location.images + t.img : subImg;

	$("#layers").find(".layerDisplay:eq(" + layer + ")").append(HTMLNode);

	HTMLImg.get(0).src = img;

	x = XMLNode.attr("x") - t.xres/2 - t.baseOffX - t.offX;
	y = XMLNode.attr("y") - t.yres + t.baseLength/2 - t.baseOffY - t.offY;

	HTMLNode.css({
		left: x + "px",
		top: y + "px",
		width: t.xres + "px",
		height: t.yres + "px"
	});

	t.dir = XMLNode.attr("dir");
	var crop = t.getAnimationFrameCrop(t.dir, t.stance, 0);
	HTMLImg.css("left", (-crop.sx + "px"));
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

	createLayer();

	$("#editorTools").show();

	return levelXML;
}

function createLayer(back, skipJson) {
	if(!back || back === "" || back == projectPath + "images/") back = subImg2;

	if(!skipJson)
	{
		levelObject.layers.push({
			displayed: true,
			background: back,
			traces: []
		});
	}

	var layerDisplay = $("<div/>");
	layerDisplay.addClass("layerDisplay");
	layerDisplay.height(BOARDY);
	layerDisplay.width(BOARDX);
	layerDisplay.html('<img class="background" src="' + back + '"/><canvas class="whiteboard" onContextMenu="return false;" width="' + BOARDX/getPixelsPerPixel() + '" height="' + BOARDY/getPixelsPerPixel() + '" style="width:' + BOARDX + 'px; height:' + BOARDY + 'px"></canvas>');

	var backupCanv = document.createElement("canvas");
	backupCanv.width = BOARDX/getPixelsPerPixel();
	backupCanv.height = BOARDY/getPixelsPerPixel();
	backupCanv.className = "backupCanv";

	layerDisplay.append(backupCanv);

	$("#layers").append(layerDisplay);

	var layerNum = $(".layerDisplay").length - 1;

	var layerOption = $("<option/>");
	layerOption.html(layerNum);
	layerOption.val(layerNum);

	$("#activeLayer").append(layerOption);

	generateLayerMenu();
}

function createObject(type, skipXML, index)  {
	if(!index)
	{
		index = $("#layers").find("." + type).length;
	}


	var positionContainer = $('<div id="' + (type + index) + '" class="draggable ' + type + '"></div>');
	positionContainer.css("position", "absolute");
	positionContainer.css("overflow", "hidden");

	var displayNPC = $('<img />');
	displayNPC.css("position", "absolute");
	positionContainer.append(displayNPC);

	var x = mouseLevelX;
	var y = mouseLevelY;
	var layer = $("#activeLayer").val();

	$("#layers .layerDisplay:eq(" + layer + ")").append(positionContainer);

	positionContainer.css({
		"left": x + "px",
		"top": y + "px",
		"width": "32px",
		"height": "64px"
	});

	if(!skipXML)
	{
		var XMLNPC = $("<" + type + ">", $levelXML);
		XMLNPC.attr({
			id: "",
			x: x,
			y: y,
			layer: layer,
			dir: 3,
			stance: "default"
		});
		$levelXML.find(type + "s").append(XMLNPC);

		typeSelected = type;
		indexSelected = XMLNPC.index();

		if(type == "position") {
			XMLNPC.append('<alias actor=""></alias>');
			showEditorPosition(XMLNPC);
		}
		else if(type == "prop") {
			showEditorProp(XMLNPC);
		}
	}

	updateObject(type, index);
}

function loadBodyFromTemplate(templateName) {
	if(!templateName) {
		return new SplitTime.Body();
	}
	else if(!(templateName in SplitTime.BodyTemplate)) {
		//alert("Invalid sprite template: " + templateName);
		return new SplitTime.Body();
	}
	else {
		return new SplitTime.BodyTemplate[templateName]();
	}
}
