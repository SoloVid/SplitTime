var projectPath = "projects/" + (window.location.hash.substring(1) || prompt("project folder name:")) + "/";

$(document).on('dragstart', 'img', function(event) { event.preventDefault(); });

setInterval(function(event) { if(document.getElementsByClassName("background").length > 0) resizeBoardCheck(document.getElementsByClassName("background")[0]); }, 100);

document.onContextMenu = function()
{
	console.log("caught context menu");
	return false;
};

$("#layers").contextmenu(function(event) { event.preventDefault(); });
$("#XMLEditor").contextmenu(function(event) { event.preventDefault(); });

$(document).keydown(function(event) {
	if(event.keyCode == 16)
	{
		ctrlDown = true;
	}
});
$(document).keypress(function(event)
{
	if(event.which == 32)
	{
		console.log("export of level XML:");
		exportLevel(levelXML);

		//console.log(JSON.stringify(document.getElementsByClassName("whiteboard")[0].getContext("2d").getImageData(0, 0, BOARDX/getPixelsPerPixel(), BOARDY/getPixelsPerPixel()), null, '\t'));

		//console.log(document.getElementById("testTA").value);
	}
});
$(document).keyup(function(event) {
	if(event.keyCode == 16)
	{
		ctrlDown = false;
	}
});

var BOARDX = 100, BOARDY = 100;
var PPP = 1; //pixels per pixel

var mode = "NPC";

var typeSelected;
var indexSelected;

$("#TextEditorDlg").hide();
$("#XMLEditor").hide();

t = new SLVDE.Sprite();

var subImg = document.getElementById("subImg");
var ctx = subImg.getContext("2d");
ctx.fillStyle = "#CD96CD";
ctx.fillRect(5, 5, t.xres - 10, t.yres - 10);
subImg = subImg.toDataURL();
var subImg2 = document.getElementById("subImg2");
ctx = subImg2.getContext("2d");
ctx.fillStyle = "rgba(0, 0, 0, 0)";
ctx.fillRect(0, 0, 320, 320);
subImg2 = subImg2.toDataURL();

var color = "rgb(255, 0, 0)";

var mouseX = 0;
var mouseY = 0;

var mouseDown = false;

var ctrlDown = false;

var follower = null;

var pathInProgress = false;

$("#fileChooser").change(function(evt) {
	cEvent = evt; //Set for r.onload
	var f = evt.target.files[0];
	if (f) {
	  var r = new FileReader();
	  r.onload = function(e) {
		var contents = e.target.result;
		loadFile2(contents);
	};
	  r.readAsText(f);
	} else {
	  alert("Failed to load file");
	}
});

$(".option").click(function() {
	pathInProgress = false;
});

$(".color").click(function() {
	color = this.style.backgroundColor;
	setMode("trace");
});

var mainBoardPrg = null;
$("#btnEnterPrg").click(function(event) {
	mainBoardPrg = "enterPrg";

	$("#TEDCode").val(levelXML.getElementsByTagName(mainBoardPrg)[0].textContent);
	$("#TextEditorDlg").show();
	$("#TEDTitle").html(mainBoardPrg);
});
$("#btnExitPrg").click(function(event) {
	mainBoardPrg = "exitPrg";

	$("#TextEditorDlg").show();
	$("#TEDCode").val(levelXML.getElementsByTagName(mainBoardPrg)[0].textContent);
	$("#TEDTitle").html(mainBoardPrg);
});
$("#TEDSaveChanges").click(function(event) {
	var code = $("#TEDCode").val();
	levelXML.getElementsByTagName(mainBoardPrg)[0].textContent = code;

	$("#TextEditorDlg").hide();
});

$(document).mousemove(function(event) {
	var regex;
	if(follower)
	{
		if(mode == "trace")
		{
			var dx = event.pageX - mouseX;
			var dy = event.pageY - mouseY;

			//console.log("moved (" + dx + ", " + dy + ")");

			XMLNode = levelXML.getElementsByTagName("trace")[follower];

			regex = /\((-?[\d]+), (-?[\d]+)\)/g;
			var pointString = XMLNode.textContent;
			//console.log("started with pointstring: " + pointString);
			XMLNode.textContent = pointString.replace(regex, function(match, p1, p2) {
				var newX = Number(p1) + dx;
				var newY = Number(p2) + dy;
				return "(" + newX + ", " + newY + ")";
			});
			//console.log("ended with pointstring: " + XMLNode.textContent);

			drawTracesFromBackup(follower);
		}
		else
		{
			var pos = $(follower).position();
			var x = pos.left + (event.pageX - mouseX);
			var y = pos.top + (event.pageY - mouseY);
			follower.style.left = x + "px";
			follower.style.top = y + "px";

			//Locate index of element
			var thisType = follower.className;
			regex = /[\s]*draggable[\s]*/;
			thisType = thisType.replace(regex, "");

			var i = /[\d]+/.exec(follower.id)[0];

			var XMLNode = levelXML.getElementsByTagName(thisType)[i];

			var template = XMLNode.getAttribute("template");

			var t = loadSpriteFromTemplate(template);

			engineX = x + t.xres/2 + t.baseOffX + t.offX;
			engineY = y + t.yres - t.baseLength/2 + t.baseOffY + t.offY;

			//Update XML
			var oldXML = XMLNode.textContent;
			regex = /obj\.setX\(-?[\d]+\);/;
			var newXML = oldXML.replace(regex, "obj.setX(" + engineX + ");");
			regex = /obj\.setY\(-?[\d]+\);/;
			newXML = newXML.replace(regex, "obj.setY(" + engineY + ");");
			levelXML.getElementsByTagName(thisType)[i].textContent = newXML;
		}
	}

	mouseX = event.pageX;
	mouseY = event.pageY;
});

$(document.body).on("mousedown", ".draggable", function(event) {
	if(mode != "trace" && event.which == 1)
	{
		if(ctrlDown)
		{
			//Locate index of element
			var thisType = this.className;
			var regex = /[\s]*draggable[\s]*/;
			thisType = thisType.replace(regex, "");

			var activeLayer = document.getElementById("activeLayer").value;

			var i = /[\d]+/.exec(this.id)[0];

			cloneIndex = 0;
			while(document.getElementById(thisType + cloneIndex)) { cloneIndex++; }


			var XMLNode = levelXML.getElementsByTagName(thisType)[i];

			var template = XMLNode.getAttribute("template");

			var t = loadSpriteFromTemplate(template);

			var HTMLClone = this.cloneNode(true);
			HTMLClone.id = thisType + cloneIndex;
			var XMLClone = XMLNode.cloneNode(true);

			document.getElementById("layers").getElementsByClassName("layerDisplay")[activeLayer].appendChild(HTMLClone);

			levelXML.getElementsByTagName(thisType + "s")[0].appendChild(XMLClone);

			follower = HTMLClone;

			generateLayerMenu();
		}
		else
		{
			follower = this;
		}
	}
});
$(document.body).on("dblclick", ".draggable", function(event) {
	//Locate index of element
	var thisType = this.className;
	var regex = /[\s]*draggable[\s]*/;
	typeSelected = thisType.replace(regex, "");

	var i = /[\d]+/.exec(this.id)[0];

	indexSelected = i;

	$("#XMLEditor").show();
	$("#template").prop('disabled', false);
	$("#template").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].getAttribute("template"));
	$("#hardCode").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].textContent);
});
$(document.body).on("mouseup", ".draggable", function(event) {
	follower = null;
});

$(document.body).on("mousedown", "#layers", function(event) {
	mouseDown = true;

	var pos = $(this).position();

	if(mode == "trace")
	{
		if(event.which == 1)
		{
			if(!pathInProgress)
			{
				var traceIndexClicked = findTrace(mouseX - pos.left, mouseY - pos.top);
				//console.log("clicked trace: " + traceIndexClicked);

				if(traceIndexClicked < 0) return;

				if(ctrlDown)
				{
					var traceList = levelXML.getElementsByTagName("trace");
					follower = traceList.length;
					var traceClicked = traceList[traceIndexClicked];
					var traceClone = traceClicked.cloneNode(true);
					traceClicked.parentNode.appendChild(traceClone);
					generateLayerMenu();
				}
				else
				{
					follower = traceIndexClicked;
				}
				drawTraces(follower, "backupCanv");
				drawTracesFromBackup(follower);
			}
			else
			{
				pathInProgress.textContent += " (" + Math.floor((mouseX - pos.left)/getPixelsPerPixel()) + ", " + Math.floor((mouseY - pos.top)/getPixelsPerPixel()) + ")";
				drawTraces();
			}
		}
		else if(event.which == 3)
		{
			if(!pathInProgress)
			{
				var trace = levelXML.createElement("trace");

				trace.setAttribute("template", color);

				trace.textContent = "(" + Math.floor((mouseX - pos.left)/getPixelsPerPixel()) + ", " + Math.floor((mouseY - pos.top)/getPixelsPerPixel()) + ")";
				pathInProgress = trace;

				var activeLayer = document.getElementById("activeLayer").value;

				levelXML.getElementsByTagName("traces")[activeLayer].appendChild(trace);

				generateLayerMenu();
				drawTraces();
			}
			else
			{
				if(!ctrlDown)
				{
					pathInProgress.textContent += " (close)";
				}
				pathInProgress = false;
				drawTraces();
			}
		}

		//drawTraces();
	}
	else if(mode == "NPC" || mode == "boardObj")
	{
		if(event.which == 1)
		{

		}
		else if(event.which == 3)
		{
			createObject(mode);
		}
	}
});
$(document.body).on("dblclick", "#layers", function(event) {
	var pos = $(this).position();

	if(mode == "trace")
	{
		var traceIndexClicked = findTrace(mouseX - pos.left, mouseY - pos.top);

		if(traceIndexClicked >= 0)
		{
			openXMLEditor(levelXML.getElementsByTagName("trace")[traceIndexClicked]);
		}
	}

	event.preventDefault();
});

$(document).mouseup(function() { follower = null; mouseDown = false; });

/*$("#layerMenu").on("click", ".layerLabel", function(event) {
	$(this).effect( "highlight", {color:"rgba(255, 255, 0)"}, 3000 );
});*/

$("#layerMenu").on("dblclick", ".layerLabel", function(event)
{
	var layerList = document.getElementById("layerMenu").getElementsByClassName("layerLabel");

	var i = 0;

	while(layerList[i] != this)
	{
		i++;
	}

	levelXML.getElementsByTagName("background")[i].textContent = prompt("Background image:", levelXML.getElementsByTagName("background")[i].textContent);

	document.getElementsByClassName("background")[i].onload = function()
	{
		var img = document.getElementsByClassName("background")[i];
		resizeBoard(img.width, img.height);
	};

	document.getElementsByClassName("background")[i].src = projectPath + "images/" + levelXML.getElementsByTagName("background")[i].textContent;
});

$("#layerMenu").on("click", ":checkbox", function(event) {
	var layerList = document.getElementById("layerMenu").getElementsByTagName("input");

	var i = 0;

	while(layerList[i] != this)
	{
		i++;
	}

	var layerDisplay = document.getElementsByClassName("layerDisplay")[i];

	if($(this).is(":checked"))
	{
		$(layerDisplay).show();
	}
	else
	{
		$(layerDisplay).hide();
	}
});

$("#layerMenu").on("mouseenter", ".trace", function(event) {
	typeSelected = "trace";

	var traceList = document.getElementById("layerMenu").getElementsByClassName(typeSelected);

	var i = 0;

	while(traceList[i] != this)
	{
		i++;
	}

	indexSelected = i;

	drawTraces(indexSelected);
});
$("#layerMenu").on("click", ".trace", function(event) {
	typeSelected = "trace";

	var traceList = document.getElementById("layerMenu").getElementsByClassName(typeSelected);

	var i = 0;

	while(traceList[i] != this)
	{
		i++;
	}

	indexSelected = i;

	$("#XMLEditor").show();
	$("#template").prop('disabled', false);
	$("#template").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].getAttribute("template"));
	$("#hardCode").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].textContent);
});

$("#layerMenu").mouseleave(function(event) {
	drawTraces();
});

$("#layerMenu").on("mouseenter", ".boardObj", function(event) {
	typeSelected = "boardObj";

	var i = /[\d]+/.exec(this.id)[0];

	$("#boardObj" + i).css("background-color", "rgba(255, 255, 0, 1)");//.effect( "highlight", {color:"rgba(255, 255, 0)"}, 3000 );
});
$("#layerMenu").on("mouseleave", ".boardObj", function(event) {
	typeSelected = "boardObj";

	var i = /[\d]+/.exec(this.id)[0];

	$("#boardObj" + i).css("background-color", "rgba(255, 255, 0, 0)");//.effect( "highlight", {color:"rgba(255, 255, 0)"}, 3000 );
});
$("#layerMenu").on("click", ".boardObj", function(event) {
	typeSelected = "boardObj";

	var i = /[\d]+/.exec(this.id)[0];

	indexSelected = i;

	$("#XMLEditor").show();
	$("#template").prop('disabled', false);
	$("#template").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].getAttribute("template"));
	$("#hardCode").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].textContent);
});

$("#layerMenu").on("mouseenter", ".NPC", function(event) {
	typeSelected = "NPC";

	var i = /[\d]+/.exec(this.id)[0];

	$("#NPC" + i).css("background-color", "rgba(255, 255, 0, 1)");//.effect( "highlight", {color:"rgba(255, 255, 0)"}, 3000 );

//	$(document.getElementById("layers").getElementsByClassName("NPC")[i]).effect( "highlight", {color:"#FFFFAA"}, 3000 );
});
$("#layerMenu").on("mouseleave", ".NPC", function(event) {
	typeSelected = "NPC";

	var traceList = document.getElementById("layerMenu").getElementsByClassName(typeSelected);

	var i = /[\d]+/.exec(this.id)[0];

	$("#NPC" + i).css("background-color", "rgba(255, 255, 0, 0)");//.effect( "highlight", {color:"rgba(255, 255, 0)"}, 3000 );

//	$(document.getElementById("layers").getElementsByClassName("NPC")[i]).effect( "highlight", {color:"#FFFFAA"}, 3000 );
});
$("#layerMenu").on("click", ".NPC", function(event) {
	typeSelected = "NPC";

	var i = /[\d]+/.exec(this.id)[0];

	indexSelected = i;

	$("#XMLEditor").show();
	$("#template").prop('disabled', false);
	$("#template").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].getAttribute("template"));
	$("#hardCode").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].textContent);
});

$("#layerMenu").on("click", ".boardPrg", function(event)
{
	typeSelected = "boardPrg";

	var traceList = document.getElementById("layerMenu").getElementsByClassName(typeSelected);

	var i = 0;

	while(traceList[i] != this)
	{
		i++;
	}

	indexSelected = i;

	$("#XMLEditor").show();
	$("#template").prop('disabled', true);
	$("#template").val("Board Program #" + i);
	$("#hardCode").val(levelXML.getElementsByTagName(typeSelected)[indexSelected].textContent);
});

$("#saveChanges").click(function(event)
{
	//Save node info
	var node = levelXML.getElementsByTagName(typeSelected)[indexSelected];

	node.textContent = $("#hardCode").val();
	node.setAttribute("template", $("#template").val());

	$("#XMLEditor").hide();

	//Update graphics
	if(typeSelected == "NPC" || typeSelected == "boardObj")
	{
		updateObject(typeSelected, indexSelected);
		generateLayerMenu();
	}
	else
	{
		generateLayerMenu();
		drawTraces();
	}
});

$("#deleteThing").click(function(event)
{
	if(!confirm("Are you sure you want to delete this?")) return;

	//Get node info
	var node = levelXML.getElementsByTagName(typeSelected)[indexSelected];

	node.parentNode.removeChild(node);

	$("#XMLEditor").hide();

	var HTMLNode = document.getElementById(typeSelected + indexSelected);

	HTMLNode.parentNode.removeChild(HTMLNode);

	var i = indexSelected;

	i++;
	while(document.getElementById(typeSelected + i))
	{
		document.getElementById(typeSelected + i).id = typeSelected + (i - 1);
		i++;
	}

//	try { var HTMLNode = document.getElementById("layers").getElementsByClassName(typeSelected)[indexSelected];
//	HTMLNode.parentNode.removeChild(HTMLNode); } catch(e) { console.log(e); }

	//Redraw menu
	generateLayerMenu();
	drawTraces();
});

$("#closeXMLEditor").click(function(event)
{
	$("#XMLEditor").hide();

	generateLayerMenu();
});

//$("#whiteboard").mouseleave(function() { mouseDown = false; });

//Resize board as needed
/*setInterval(function()
{
	var maxX = 100;
	var maxY = 100;

	var b = $(".layerDisplay").get();

	b.forEach(function (back)
	{
		if($(back).width() > maxX) maxX = $(back).width();
		if($(back).height() > maxY) maxY = $(back).height();
	});

	if(maxX != BOARDX || maxY != BOARDY)
	{
		resizeBoard(maxX, maxY);
		console.log("resizing board");
	}
}, 2000);*/
