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
				color = "#FFFF00";
			}

			var traceStr = normalizeTraceStr($(this).text());
			SplitTime.Trace.draw(traceStr, ctx, color);

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
	SplitTime.Trace.draw(traceStr, ctx, "#FFFF00");

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

	levelXML = $.parseXML(data);
	$levelXML = $(levelXML);

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
	var xmltext = exportLevel(levelXML);

	var filename = "level_" + $levelXML.find("name").text() + ".xml";

	var pom = $('<a></a>');
	pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xmltext));
	pom.attr('download', filename);
	pom.css('display', 'none');
	$(document).append(pom);
	pom.click();
	pom.remove();
}

function resizeBoard(x, y) {
	if(!x || !y)
	{
		BOARDX = Number(prompt("Width: ", BOARDX));
		BOARDY = Number(prompt("Width: ", BOARDY));
	}
	else
	{
		BOARDX = Number(x);
		BOARDY = Number(y);
	}

	$("#layers").css("width", (BOARDX + 220) + "px");
	$("#layers").css("height", (BOARDY) + "px");

	$(".whiteboard").each(function() {
		ctx = this.getContext("2d");
		ctx.canvas.width = BOARDX/getPixelsPerPixel();
		ctx.canvas.height = BOARDY/getPixelsPerPixel();
		$(this).width(BOARDX);
		$(this).height(BOARDY);
	});

	$(".backupCanv").each(function() {
		ctx = this.getContext("2d");
		ctx.canvas.width = BOARDX/getPixelsPerPixel();
		ctx.canvas.height = BOARDY/getPixelsPerPixel();
		$(this).width(BOARDX);
		$(this).height(BOARDX);
	});

	$(".layerDisplay").each(function() {
		$(this).width(BOARDX);
		$(this).height(BOARDX);
	});

	drawTraces();
}

function resizeBoardCheck(imgEl) {
	var layerWidth = imgEl.width;
	var layerHeight = imgEl.height;

	if(layerWidth > BOARDX || layerHeight > BOARDY)
	{
		resizeBoard(layerWidth, layerHeight);
	}
}

function generateLayerMenu() {
	var layerMenu = $("#layerMenu");
	var node;

	layerMenu.find(".menuLayer").remove();

	$levelXML.find("layer").each(function(i) {
		var menuLayer = $("<div></div>");
		menuLayer.addClass("menuLayer");
		menuLayer.insertBefore($("#layerMenuBreak"));

		var layerLabel = $("<div></div>");
		layerLabel.addClass("layerLabel");
		layerLabel.text("Layer " + i);
		layerLabel.css("display", "inline");
		menuLayer.append(layerLabel);

		var checkBox = $('<input type="checkbox"></input>');
		if($("#layerDisplay:eq(" + i + ")").is(":visible")) {
			checkBox.prop("checked", true);
		}
		checkBox.css("display", "inline");
		menuLayer.append(checkBox);

		$(this).find("trace").each(function(j) {
			node = $('<div class="trace">Trace ' + j + '</div>');
			node.css("paddingLeft", "10px");
			menuLayer.append(node);
		});
	});

	$levelXML.find("prop").each(function(i) {
		node = implantMenuItem(this);
		node.addClass("prop");
		node.html("Prop " + i);
		node.attr("id", "prop" + i + "Handle");
	});

	$levelXML.find("position").each(function(i) {
		node = implantMenuItem(this);
		node.addClass("position");
		node.html("position " + i);
		node.attr("id", "position" + i + "Handle");
	});
}

//Used solely in above function
function implantMenuItem(XMLNode) {
	var layerMenu = $("#layerMenu");
	var node = $("<div></div>");
	node.css("paddingLeft", "10px");

	var objLayer = $(XMLNode).attr("layer");

	objLayer = Number(objLayer);

	var menuLayer = layerMenu.find(".menuLayer:eq(" + objLayer + ")");
	menuLayer.append(node);

	return node;
}

function getPixelsPerPixel() {
	var lType = $levelXML.find("type").text();

	if(lType == "TRPG") return 32;
	else return 1;
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

function openXMLEditor(node, disableTemplate) {
	typeSelected = node.get(0).tagName;

	indexSelected = node.index();

	$("#XMLEditorBack").show();
	if(disableTemplate)
	{
		$("#template").prop('disabled', true);
		$("#template").val("Board Program #" + i);
	}
	else
	{
		$("#template").prop('disabled', false);
		$("#template").val(node.getAttribute("template"));
	}
	$("#hardCode").val(node.textContent);
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

	HTMLImg.css("left", (-(t.xres*SplitTime.determineColumn(XMLNode.attr("dir")))) + "px");
}

function createLevel(name, type) {
	if(!name)
	{
		name = prompt("Level name:");
	}
	if(!type)
	{
		type = prompt("Type: (action/overworld)");
	}

	levelXML = $.parseXML('<?xml version="1.0" encoding="UTF-8"?><level xmlns="http://www.solovid.com/SplitTime/"></level>', "text/xml");
	$levelXML = $(levelXML);

	$levelXML.find("level").append("<name>" + name + "</name>");
	$levelXML.find("level").append("<type>" + type + "</type>");

	$levelXML.find("level").append("<enterFunction/>");
	$levelXML.find("level").append("<exitFunction/>");
	$levelXML.find("level").append("<layers/>");
	$levelXML.find("level").append("<positions/>");
	$levelXML.find("level").append("<props/>");

	createLayer();

	$("#editorTools").show();

	return levelXML;
}

function createLayer(back, skipXML) {
	if(!back || back === "" || back == projectPath + "images/") back = subImg2;

	if(!skipXML)
	{
		var layerNode = $("<layer>", $levelXML);

		var background = $("<background>", $levelXML);
		layerNode.append(background);

		var traces = $("<traces>", $levelXML);

		layerNode.append(traces);

		$levelXML.find("layers").append(layerNode);
	}

	var layerDisplay = $("<div/>");
	layerDisplay.addClass("layerDisplay");
	layerDisplay.height(BOARDY);
	layerDisplay.width(BOARDX);
	layerDisplay.html('<img class="background" src="' + back + '"></img><canvas class="whiteboard" onContextMenu="return false;" width="' + BOARDX/getPixelsPerPixel() + '" height="' + BOARDY/getPixelsPerPixel() + '" style="width:' + BOARDX + 'px; height:' + BOARDY + 'px"></canvas>');

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

	var defImg = "";

	var displayNPC = $('<img />');
	displayNPC.css("position", "absolute");
	positionContainer.append(displayNPC);

	var pos = $("#layers").position();
	var x = mouseLevelX;
	var y = mouseLevelY;
	var layer = $("#activeLayer").val();
	var xres = 32;
	var yres = 64;

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

function exportLevel(XML) {
	var prettyXML = vkbeautify.xml(/*'<?xml version="1.0" encoding="UTF-8"?>' + */(new XMLSerializer()).serializeToString(XML), "\t");
	console.log(prettyXML);
	return prettyXML;
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
