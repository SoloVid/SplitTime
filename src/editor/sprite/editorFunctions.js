var BASE_BORDER_WIDTH = 5; //display only

function toPolygon() { console.log("polygon mode"); mode = "polygon"; }
function toNPC() { mode = "NPC"; }
function toBoardObj() { mode = "prop"; }

function setMode(name) { mode = name; }

function reset(code) {
	$("#spriteEverything").empty();
	loadFile2(code);
}

function addNewTrace(string, color)
{
	if(getTraceCount() === 0)
	{
		spriteCode += "\nt.prototype.addStaticTrace(\"" + string + "\", \"" + color + "\");";
	}
	else {
		var lastTraceLine = getTraceLine(getTraceCount() - 1);
		var newLine = lastTraceLine.replace(getTraceString(getTraceCount() - 1), string);
		newLine = newLine.replace(getTraceColor(getTraceCount() - 1), color);
		spriteCode = spriteCode.replace(lastTraceLine, lastTraceLine + "\n" + newLine);
	}
}

function replaceTraceColor(index, color)
{
	var oldLine = getTraceLine(index);
	var newLine = oldLine.replace(getTraceColor(index), color);
	spriteCode = spriteCode.replace(oldLine, newLine);
}
function replaceTraceString(index, string)
{
	var oldLine = getTraceLine(index);
	var newLine = oldLine.replace(getTraceString(index), string);
	spriteCode = spriteCode.replace(oldLine, newLine);
}

function getTraceCount()
{
	var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	var traceLines = spriteCode.match(traceLineRegex);
	return traceLines ? traceLines.length : 0;
}

function getTraceLine(index)
{
	var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	var traceLines = spriteCode.match(traceLineRegex);
	return traceLines[index];
}

function getTraceString(index)
{
	// var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	// var traceLines = spriteCode.match(traceLineRegex);

	var traceLinePartsRegex = /\("([^"]*)", "([^"]*)"\)/;
	var traceLineParts = traceLinePartsRegex.exec(getTraceLine(index));//traceLines[index]);
	var traceStr = traceLineParts[1];
	var traceColor = traceLineParts[2];

	return traceStr;
}
function getTraceColor(index)
{
	// var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	// var traceLines = spriteCode.match(traceLineRegex);

	var traceLinePartsRegex = /\("([^"]*)", "([^"]*)"\)/;
	var traceLineParts = traceLinePartsRegex.exec(getTraceLine(index));//traceLines[index]);
	var traceStr = traceLineParts[1];
	var traceColor = traceLineParts[2];

	return traceColor;
}

function drawTraces(highlightIndex, drawTo)
{
	var ignoreHighlighted = false;
	if(!drawTo)
	{
		drawTo = "whiteboard";
	}
	else
	{
		ignoreHighlighted = true;
	}

	var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	var traceLines = spriteCode.match(traceLineRegex);
	var traceLineCount = traceLines ? traceLines.length : 0;

	var canv = document.getElementsByClassName("whiteboard")[0];
	var ctx = canv.getContext("2d");
	ctx.clearRect(0, 0, canv.width, canv.height);

	ctx.translate(0.5, 0.5);

	for(var j = 0; j < traceLineCount; j++)
	{
		var traceLinePartsRegex = /\("([^"]*)", "([^"]*)"\)/;
		var traceLineParts = traceLinePartsRegex.exec(traceLines[j]);
		var traceStr = traceLineParts[1];
		var traceColor = traceLineParts[2];

		if(highlightIndex !== undefined && highlightIndex == j)
		{
			if(ignoreHighlighted)
			{
				continue;
			}
			traceColor = "#0000FF";
		}

		SplitTime.drawVector(traceStr, ctx, traceColor, {x: getOriginX(), y: getOriginY()});

	}
	ctx.translate(-0.5, -0.5);
}

function drawTracesFromBackup(highlightIndex) {
	var XMLLayers = levelXML.getElementsByTagName("layer");
	var ctx;
	var cnvLayers = document.getElementsByClassName("whiteboard");
	var backupLayers = document.getElementsByClassName("backupCanv");

	var i;

	for(i = 0; i < XMLLayers.length; i++)
	{
		ctx = cnvLayers[i].getContext("2d");

		ctx.clearRect(window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20);

		ctx.drawImage(backupLayers[i], window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20, window.pageXOffset - 120, window.pageYOffset - 10, window.innerWidth + 20, window.innerHeight + 20);
	}

	i--;

	var highlightTrace = levelXML.getElementsByTagName("trace")[highlightIndex];

	ctx = cnvLayers[i].getContext("2d");

	ctx.translate(0.5, 0.5);

	ctx.strokeStyle = "#0000FF";

	ctx.fillStyle = ctx.strokeStyle;

	var regex = /\([^\)]+\)/g;
	var xRegex = /\((-?[\d]*),/;
	var yRegex = /,[\s]*(-?[\d]*)\)/;
	var newX, newY;

	var pointStr = highlightTrace.textContent;//.getElementsByTagName("path")[0].textContent;
	var points = pointStr.match(regex);
	//console.log(points.length + "|" + points + "|");

	ctx.beginPath();

	newX = points[0].match(xRegex)[1];
	newY = points[0].match(yRegex)[1];

	ctx.moveTo(newX, newY);

	ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);

	for(var k = 1; k < points.length; k++)
	{
		if(points[k] == "(close)")
		{
			ctx.closePath();
			ctx.stroke();
			ctx.fill();
		}
		else
		{
			newX = points[k].match(xRegex)[1];
			newY = points[k].match(yRegex)[1];

			ctx.lineTo(newX, newY);
			ctx.stroke();
			ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);
		}
	}
	ctx.translate(-0.5, -0.5);
}

function findTrace(x, y) {
	var traceLineRegex = /t\.prototype\.addStaticTrace\("[^"]*", "[^"]*"\);/g;
	var traceLines = spriteCode.match(traceLineRegex);
	var traceLineCount = traceLines ? traceLines.length : 0;

	var canv = document.getElementsByClassName("whiteboard")[0];
	var ctx = canv.getContext("2d");
	ctx.clearRect(0, 0, canv.width, canv.height);

	ctx.translate(0.5, 0.5);

	for(var j = 0; j < traceLineCount; j++)
	{
		var traceLinePartsRegex = /\("([^"]*)", "([^"]*)"\)/;
		var traceLineParts = traceLinePartsRegex.exec(traceLines[j]);
		var traceStr = traceLineParts[1];
		var traceColor = traceLineParts[2];

		SplitTime.drawVector(traceStr, ctx, traceColor, {x: getOriginX(), y: getOriginY()});

		var imgData = ctx.getImageData(x, y, 1, 1);

		if(imgData.data[3] !== 0)
		{
			ctx.translate(-0.5, -0.5);
			return j;
		}

	}
	ctx.translate(-0.5, -0.5);

	return -1;
}

function clickFileChooser() {
	$("#fileChooser").click();
}

function getChildCount() {
	var childMatches = spriteCode.match(/this\.addChild/g);
	return childMatches ? childMatches.length : 0;
}

function loadFile2(data)
{
	console.log(data);
	spriteCode = data;

	createBodyImg();

	var childMatches = spriteCode.match(/this\.addChild/g);
	var childCount = childMatches ? childMatches.length : 0;
	for(var i = 0; i < childCount; i++)
	{
		createObject(true, i);
		updateObject(i);
	}

	drawTraces();

	var base = document.createElement("div");
	base.innerHTML = "<strong>&middot;</strong>";
	base.style.textAlign = "center";
	base.id = "spriteBase";
	base.style.position = "absolute";
	base.style.border = BASE_BORDER_WIDTH + "px solid purple";
	base.style.width = getBodyProperty("baseLength") + "px";
	base.style.height = base.style.width;
	base.style.lineHeight = base.style.height;
	base.style.left = -BASE_BORDER_WIDTH + (Math.round(getBodyXRes()/2) - Math.round(getBodyProperty("baseLength")/2) + getBodyProperty("baseOffX")) + "px";
	base.style.top = -BASE_BORDER_WIDTH + (getBodyYRes() - getBodyProperty("baseLength")/2 + getBodyProperty("baseOffY")) + "px";
	document.getElementById("spriteEverything").appendChild(base);
}

function downloadFile()
{
//	var xmltext = exportLevel(levelXML);

	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(spriteCode));// + encodeURIComponent(xmltext));
	pom.setAttribute('download', spriteFile);

	pom.style.display = 'none';
	document.body.appendChild(pom);

	pom.click();

	document.body.removeChild(pom);
}

function openXMLEditor(text)
{
	$("#XMLEditor").show();
	$("#hardCode").val(text);
}

function getChildObjectBlock(index)
{
	return spriteCode.match(/child = [\s\S]+?this\.addChild\(child\);/g)[index];
}

function getChildObjectTemplateFromBlock(block)
{
	var newDeclRegex = /child = new SplitTime\.BodyTemplate\["[^"]*"\]/;
	var newDecl = block.match(newDeclRegex)[0];

	var template = /"([^"]*)"/.exec(newDecl)[1];

	return new SplitTime.BodyTemplate[template]();
}

function updateObject(index)
{
	var childBlock = getChildObjectBlock(index);

	//Get Body object
	// var newDeclRegex = /child = new SplitTime\.BodyTemplate\["[^"]*"\]/;
	// var newDecl = childBlock.match(newDeclRegex)[0];
	//
	// var template = /"([^"]*)"/.exec(newDecl)[1];

	var childTemplate = getChildObjectTemplateFromBlock(childBlock);

	var HTMLNode = document.getElementById("childBody" + index);
	var HTMLImg = HTMLNode.getElementsByTagName("img")[0];

	var dRegex = /-?[\d]+/;

	var img, x, y, layer, xres, yres, dir;

	try {
		if(childTemplate.img) {
			img = projectPath + "images/" + childTemplate.img;
		}
		else {
			img = childBlock.match(/child\.img[\s]*=[\s]*"[^"]+";/)[0];
			img = projectPath + "images/" + img.match(/"(.*?)"/)[1];
		}
	}
	catch(e) { img = subImg; }

	try {
		x = childBlock.match(/child\.setX\(-?[\d]+\);/)[0];
		x = Number(x.match(dRegex)[0]);

		y = childBlock.match(/child\.setY\(-?[\d]+\);/)[0];
		y = Number(y.match(dRegex)[0]);
	}
	catch(e) { alert("You need to have x and y assigned!"); return; }

	try {
		layer = childBlock.match(/child\.setLayer\(-?[\d]+\);/)[0];
		layer = Number(layer.match(dRegex)[0]);
	}
	catch(e) { layer = childTemplate.layer; }

	try {
		xres = childBlock.match(/child\.xres[\s]*=[\s]*[\d]+;/)[0];
		xres = Number(xres.match(dRegex)[0]);

		yres = childBlock.match(/child\.yres[\s]*=[\s]*[\d]+;/)[0];
		yres = Number(yres.match(dRegex)[0]);
	}
	catch(e) { var xres = childTemplate.xres; var yres = childTemplate.yres; }

	try {
		dir = childBlock.match(/child\.dir[\s]*=[\s]*[\d]+;/)[0];
		dir = Number(dir.match(dRegex)[0]);
	}
	catch(e) { dir = childTemplate.dir; }

	document.getElementById("spriteEverything").appendChild(HTMLNode);

	HTMLImg.src = img;

	var x0 = getOriginX();
	var y0 = getOriginY();

	x = x0 + x - Math.round(xres/2) - childTemplate.baseOffX - childTemplate.offX;
	y = y0 + y - yres + Math.round(childTemplate.baseLength/2) - childTemplate.baseOffY - childTemplate.offY;

	HTMLNode.style.left = x + "px";
	HTMLNode.style.top = y + "px";

	HTMLNode.style.width = xres + "px";
	HTMLNode.style.height = yres + "px";

	HTMLImg.style.left = (-(xres*SplitTime.determineColumn(dir))) + "px";
}

function createBody(name)
{
	if(!name)
	{
		spriteName = prompt("Body name:");
		spriteFile = spriteName + ".tjs";
	}

	spriteCode = "";
	spriteCode += "function InheritableBodyTemplate" + spriteName + "() {\n";
	spriteCode += "	var child;\n";
	spriteCode += "}\n";
	spriteCode += "\n";
	spriteCode += "t = InheritableBodyTemplate" + spriteName + ";\n";
	spriteCode += "\n";
	spriteCode += "SplitTime.BodyTemplate[\"" + spriteName + "\"] = t;\n";
	spriteCode += "\n";
	spriteCode += "t.prototype = new SplitTime.Body();\n";
	spriteCode += "t.prototype.constructor = t;\n";
	spriteCode += "\n";
	spriteCode += "t.prototype.img = \"\";\n";
	spriteCode += "t.prototype.xres = 32;\n";
	spriteCode += "t.prototype.yres = 64;\n";
	spriteCode += "t.prototype.baseLength = 16;\n";
	spriteCode += "t.prototype.baseOffX = 0;\n";
	spriteCode += "t.prototype.baseOffY = 0;\n";
	spriteCode += "\n";
	//spriteCode += "t.prototype.addStaticTrace("(-25, -25) (-25, 25) (25, 25) (25, -25) (close)", "#FF0000");\n";
}

function getOriginX()
{
	return Math.round(getBodyXRes()/2) + getBodyProperty("baseOffX");
}
function getOriginY()
{
	return getBodyYRes() - Math.round(getBodyProperty("baseLength")/2) + getBodyProperty("baseOffY");
}

function getBodyDir()
{
	var lineRegex = /t\.prototype\.dir\s*=\s*([\d]+);/;
	var matchArray = lineRegex.exec(spriteCode);
	if(matchArray)
		return matchArray[1];
}
function getBodyImg()
{
	var back;
	try {
		var lineRegex = /t\.prototype\.img\s*=\s*"([^"]*)";/;
		var matchArray = lineRegex.exec(spriteCode);
		if(matchArray)
			back = projectPath + "images/" + matchArray[1];
	}
	catch(e) {
		var temp = getBodyPrototype().img;
		if(temp)
			back = projectPath + "images/" + temp;
	}
	if(!back)
		back = subImg2;

	return back;
}
function getBodyPrototype()
{
	//Get Body object
	var newDeclRegex = /t\.prototype = new SplitTime\.BodyTemplate\["[^"]*"\]/;
	try
	{
		var newDecl = spriteCode.match(newDeclRegex)[index];

		var template = /"([^"]*)"/.exec(newDecl)[1];

		return new SplitTime.BodyTemplate[template]();
	}
	catch(e)
	{
		return new SplitTime.Body();
	}
}
function getBodyProperty(prop)
{
	try {
		var lineRegex = new RegExp("t\\.prototype\\." + prop + "\\s*=\\s*(-?[\\d]+);");
		var matchArray = lineRegex.exec(spriteCode);
		if(matchArray)
			return +(matchArray[1]);
		else {
			return getBodyPrototype()[prop];
		}
	}
	catch(e) {
		return getBodyPrototype()[prop];
	}
}
function getBodyXRes()
{
	try {
		var lineRegex = /t\.prototype\.xres\s*=\s*([\d]+);/;
		var matchArray = lineRegex.exec(spriteCode);
		if(matchArray)
			return matchArray[1];
	}
	catch(e) {
		return getBodyPrototype().xres;
	}
}
function getBodyYRes()
{
	try {
		var lineRegex = /t\.prototype\.yres\s*=\s*([\d]+);/;
		var matchArray = lineRegex.exec(spriteCode);
		if(matchArray)
			return matchArray[1];
	}
	catch(e) {
		return getBodyPrototype().yres;
	}
}

function createBodyImg()
{
	var back = getBodyImg();

	var layerDisplay = document.getElementById("spriteEverything");
	layerDisplay.style.height = getBodyYRes() + "px";
	layerDisplay.style.width = getBodyXRes() + "px";

	var NPCContainer = document.createElement("div");
	NPCContainer.style.position = "absolute";
	NPCContainer.style.overflow = "hidden";
	NPCContainer.id = "mainImg";

	var displayNPC = document.createElement("img");
	displayNPC.style.position = "absolute";
	displayNPC.src = back;
	NPCContainer.appendChild(displayNPC);

	NPCContainer.style.width = getBodyXRes() + "px";
	NPCContainer.style.height = getBodyYRes() + "px";

	displayNPC.style.left = (-(getBodyXRes()*SplitTime.determineColumn(getBodyDir()))) + "px";

	layerDisplay.appendChild(NPCContainer);

	var whiteboard = document.createElement("canvas");
	whiteboard.width = getBodyXRes();
	whiteboard.height = getBodyYRes();
	whiteboard.className = "whiteboard";
	layerDisplay.appendChild(whiteboard);

	var backupCanv = document.createElement("canvas");
	backupCanv.width = getBodyXRes();
	backupCanv.height = getBodyYRes();
	backupCanv.className = "backupCanv";

	layerDisplay.appendChild(backupCanv);
}

function createObject(skipCode, index)
{
	if(index === undefined)
	{
		index = getChildCount();
	}

	var NPCContainer = document.createElement("div");
	NPCContainer.id = "childBody" + index;
	$(NPCContainer).addClass("draggable");
	$(NPCContainer).addClass("childBody");
	NPCContainer.style.position = "absolute";
	NPCContainer.style.overflow = "hidden";

	var defImg = "";

	var displayNPC = document.createElement("img");
	displayNPC.style.position = "absolute";
	displayNPC.src = defImg;
	NPCContainer.appendChild(displayNPC);

	var pos = $("#spriteEverything").position();
	var x = mouseX - pos.left;
	var y = mouseY - pos.top;
	var layer = 0;
	var xres = 32;
	var yres = 64;

	document.getElementById("spriteEverything").appendChild(NPCContainer);

	NPCContainer.style.left = x + "px";
	NPCContainer.style.top = y + "px";
	NPCContainer.style.width = xres + "px";
	NPCContainer.style.height = yres + "px";


	if(!skipCode)
	{
		spriteCode = spriteCode.replace("var child;", "var child;\n\tchild = new SplitTime.BodyTemplate[\"\"]();\n\tchild.setX(" + x + ");\n\tchild.setY(" + y + ");\n\tchild.setLayer(0);\n\tthis.addChild(child);");

		reset(spriteCode);

		openXMLEditor(spriteCode);
	}

}

function exportLevel(XML)
{
	// var prettyXML = vkbeautify.xml(/*'<?xml version="1.0" encoding="UTF-8"?>' + */(new XMLSerializer()).serializeToString(XML), "\t");
	// console.log(prettyXML);
	// return prettyXML;
}

function loadBodyFromTemplate(templateName) {
	if(!templateName) {
		return new SplitTime.Body();
	}
	else if(!(templateName in SplitTime.BodyTemplate)) {
		alert("Invalid sprite template!");
		return new SplitTime.Body();
	}
	else {
		return new SplitTime.BodyTemplate[templateName]();
	}
}
