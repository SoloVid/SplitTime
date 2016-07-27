var BOARDX = 100, BOARDY = 100;
var PPP = 1; //pixels per pixel

var mode = "position";

var typeSelected;
var indexSelected;
var color;

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var ctrlDown = false;

var follower = null;
var pathInProgress = false;

var subImg;
var ctx;
var subImg2;

var mainBoardPrg = null;

var editorOpen = null;

// $(document).on("load", "#staticScript", function() {
// 	subImg = $("#subImg").get(0);
// 	ctx = subImg.getContext("2d");
// 	subImg2 = $("#subImg2").get(0);
//
// 	t = new SplitTime.Body();
// 	ctx.fillStyle = "#CD96CD";
// 	ctx.fillRect(5, 5, t.xres - 10, t.yres - 10);
// 	subImg = subImg.toDataURL();
// 	ctx = subImg2.getContext("2d");
// 	ctx.fillStyle = "rgba(0, 0, 0, 0)";
// 	ctx.fillRect(0, 0, 320, 320);
// 	subImg2 = subImg2.toDataURL();
// });
var projectName = window.location.hash.substring(1);
while(!projectName) {
	projectName = prompt("project folder name:");
}
window.location.hash = "#" + projectName;
var projectPath = "projects/" + projectName + "/";

$(document).ready(function() {
	$.getScript(projectPath + "dist/static.js", function() {
		subImg = $("#subImg").get(0);
		ctx = subImg.getContext("2d");
		subImg2 = $("#subImg2").get(0);

		t = new SplitTime.Body();
		ctx.fillStyle = "#CD96CD";
		ctx.fillRect(5, 5, t.xres - 10, t.yres - 10);
		subImg = subImg.toDataURL();
		ctx = subImg2.getContext("2d");
		ctx.fillStyle = "rgba(0, 0, 0, 0)";
		ctx.fillRect(0, 0, 320, 320);
		subImg2 = subImg2.toDataURL();

		for(var traceType in SplitTime.Trace.editorColors) {
			$("#traceOptions").append('<div class="option" style="background-color: ' + SplitTime.Trace.editorColors[traceType] + '">' + traceType + '</div>');
		}
	});

	$(document).on('dragstart', 'img', function(event) {
		event.preventDefault();
	});
	$(document).on('contextmenu', function(event) {
		event.preventDefault();
	});
	// $(document).on('click', function(event) {
	// 	event.preventDefault();
	// });
	$(document).on('dblclick', function(event) {
		event.preventDefault();
	});

	setInterval(function(event) {
		if(document.getElementsByClassName("background").length > 0)
		resizeBoardCheck(document.getElementsByClassName("background")[0]);
	}, 1000);

	$(document).keydown(function(event) {
		if(event.which == 16)
		{
			ctrlDown = true;
		}
	});
	$(document).keyup(function(event) {
		if(event.which == 16)
		{
			ctrlDown = false;
		}
		else if(event.which == 32)
		{
			console.log("export of level XML:");
			exportLevel(levelXML);
		}
	});

	$("#XMLEditorBack").hide();

	$("#XMLEditorBack").click(function(event) {
		if(event.target == this) {
			$("#XMLEditorBack").hide();
		}
	});

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

	$(document.body).on("click", ".option", function() {
		pathInProgress = false;
	});

	$("#traceOptions").on("click", ".option", function() {
		typeSelected = $(this).text();
		color = this.style.backgroundColor;
		setMode("trace");
	});

	$("#btnEnterFunc").click(function(event) {
		editorOpen = "enterFunction";
		mainBoardPrg = "enterFunction";

		var currentReference = $levelXML.find(mainBoardPrg).text();

		showEditor([
			{
				type: "input",
				title: "Board Entrance Function",
				value: currentReference,
				id: "reference"
			}
		]);
	});
	$("#btnExitFunc").click(function(event) {
		editorOpen = exitFunction;
		mainBoardPrg = "exitFunction";

		var currentReference = $levelXML.find(mainBoardPrg).text();

		showEditor([
			{
				type: "input",
				title: "Board Exit Function",
				value: currentReference,
				id: "reference"
			}
		]);
	});

	$(document).mousemove(function(event) {
		var regex;
		if(follower || follower === 0)
		{
			if(mode == "trace")
			{
				var dx = event.pageX - mouseX;
				var dy = event.pageY - mouseY;

				XMLNode = $levelXML.find("trace:eq(" + follower + ")");

				regex = /\((-?[\d]+), (-?[\d]+)\)/g;
				var pointString = XMLNode.text();
				XMLNode.text(pointString.replace(regex, function(match, p1, p2) {
					var newX = Number(p1) + dx;
					var newY = Number(p2) + dy;
					return "(" + newX + ", " + newY + ")";
				}));

				drawTracesFromBackup(follower);
			}
			else
			{
				var pos = follower.position();
				var x = pos.left + (event.pageX - mouseX);
				var y = pos.top + (event.pageY - mouseY);
				follower.css("left", x + "px");
				follower.css("top", y + "px");

				//Locate index of element
				var clazz = follower.attr("class");
				regex = /[\s]*draggable[\s]*/;
				thisType = clazz.replace(regex, "");

				var i = /[\d]+/.exec(follower.attr("id"))[0];

				var XMLNode = $levelXML.find(thisType + ":eq(" + i + ")");

				var t;
				if(thisType == "prop") {
					t = loadBodyFromTemplate(XMLNode.attr("template"));
				}
				else if(thisType == "position") {
					t = SplitTime.Actor[XMLNode.find("alias").attr("actor")] || loadBodyFromTemplate();
				}

				engineX = x + t.xres/2 + t.baseOffX + t.offX;
				engineY = y + t.yres - t.baseLength/2 + t.baseOffY + t.offY;

				XMLNode.attr("x", engineX);
				XMLNode.attr("y", engineY);
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

				cloneIndex = $("." + thisType).length;

				var XMLNode = $levelXML.find(thisType + ":eq(" + i + ")");

				var template = XMLNode.attr("template");

				var t = loadBodyFromTemplate(template);

				var HTMLClone = this.cloneNode(true);
				HTMLClone.id = thisType + cloneIndex;
				var XMLClone = XMLNode.cloneNode(true);

				$("#layers").find(".layerDisplay:eq(" + activeLayer + ")").append(HTMLClone);

				$levelXML.find(thisType + "s").append(XMLClone);

				follower = $(HTMLClone);

				generateLayerMenu();
			}
			else
			{
				follower = $(this);
			}
		}
	});
	$(document.body).on("dblclick", ".draggable.position", function(event) {
		//Locate index of element
		var i = /[\d]+/.exec(this.id)[0];
		indexSelected = i;

		showEditorPosition($levelXML.find("position:eq(" + indexSelected + ")"));
	});
	$(document.body).on("dblclick", ".draggable.prop", function(event) {
		//Locate index of element
		var i = /[\d]+/.exec(this.id)[0];
		indexSelected = i;

		showEditorProp($levelXML.find("prop:eq(" + indexSelected + ")"));
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
					console.log("clicked trace: " + traceIndexClicked);

					if(traceIndexClicked < 0) return;

					if(ctrlDown)
					{
						var traceList = $levelXML.find("trace");
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
					var oldDef = pathInProgress.text();
					pathInProgress.text(oldDef + " (" + Math.floor((mouseX - pos.left)/getPixelsPerPixel()) + ", " + Math.floor((mouseY - pos.top)/getPixelsPerPixel()) + ")");
					drawTraces();
				}
			}
			else if(event.which == 3)
			{
				if(!pathInProgress)
				{
					var trace = $("<trace/>", $levelXML);

					trace.attr("type", typeSelected);

					trace.text("(" + Math.floor((mouseX - pos.left)/getPixelsPerPixel()) + ", " + Math.floor((mouseY - pos.top)/getPixelsPerPixel()) + ")");
					pathInProgress = trace;

					var activeLayer = $("#activeLayer").val();

					$levelXML.find("traces:eq(" + activeLayer + ")").append(trace);

					generateLayerMenu();
					drawTraces();
				}
				else
				{
					if(!ctrlDown)
					{
						pathInProgress.text(pathInProgress.text() + " (close)");
					}
					pathInProgress = false;
					drawTraces();
				}
			}
		}
		else if(mode == "position" || mode == "prop")
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
				showEditorTrace($levelXML.find("trace:eq(" + traceIndexClicked + ")"));
			}
		}

		event.preventDefault();
	});

	$(document).mouseup(function() { follower = null; mouseDown = false; });


	$("#layerMenu").on("dblclick", ".layerLabel", function(event) {
		var layerList = $("#layerMenu").find(".layerLabel");

		var i = $(this).index(layerList);

		var XMLLayerBack = $levelXML.find("background:eq(" + i + ")");
		XMLLayerBack.text(prompt("Background image:", XMLLayerBack.text()));

		var HTMLLayerBack = document.getElementsByClassName("background")[i];
		HTMLLayerBack.onload = function()
		{
			var img = HTMLLayerBack;
			resizeBoard(img.width, img.height);
		};

		HTMLLayerBack.src = projectPath + "images/" + XMLLayerBack.text();
	});

	$("#layerMenu").on("click", ":checkbox", function(event) {
		var layerList = $("#layerMenu").find("input");

		var i = $(this).index(layerList);

		var layerDisplay = $(".layerDisplay:eq(" + i + ")");

		if($(this).is(":checked"))
		{
			layerDisplay.show();
		}
		else
		{
			layerDisplay.hide();
		}
	});

	$("#layerMenu").on("mouseenter", ".trace", function(event) {
		var i = $(this).index("#layerMenu .trace");
		drawTraces(i);
	});
	$("#layerMenu").on("click", ".trace", function(event) {
		typeSelected = "trace";
		var i = $(this).index("#layerMenu .trace");
		indexSelected = i;

		showEditorTrace($levelXML.find("trace:eq(" + indexSelected + ")"));
	});

	$("#layerMenu").mouseleave(function(event) {
		drawTraces();
	});

	$("#layerMenu").on("mouseenter", ".prop", function(event) {
		var i = /[\d]+/.exec(this.id)[0];
		$("#prop" + i).css("background-color", "rgba(255, 255, 0, 1)");
	});
	$("#layerMenu").on("mouseleave", ".prop", function(event) {
		var i = /[\d]+/.exec(this.id)[0];
		$("#prop" + i).css("background-color", "");
	});
	$("#layerMenu").on("click", ".prop", function(event) {
		typeSelected = "prop";

		var i = /[\d]+/.exec(this.id)[0];

		indexSelected = i;

		var prop = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");
		showEditorProp(prop);
	});

	$("#layerMenu").on("mouseenter", ".position", function(event) {
		var i = /[\d]+/.exec(this.id)[0];
		$("#position" + i).css("background-color", "rgba(255, 255, 0, 1)");
	});
	$("#layerMenu").on("mouseleave", ".position", function(event) {
		var i = /[\d]+/.exec(this.id)[0];
		$("#position" + i).css("background-color", "");
	});
	$("#layerMenu").on("click", ".position", function(event) {
		typeSelected = "position";

		var i = /[\d]+/.exec(this.id)[0];

		indexSelected = i;

		var position = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");
		showEditorPosition(position);
	});

	$("#saveChanges").click(function(event) {
		var node;
		switch(editorOpen) {
			case "enterFunction":
			case "exitFunction":
				$levelXML.find(mainBoardPrg).text(getEditorValue("reference"));
				break;
			case "position":
				node = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");

				node.attr("id", getEditorValue("id"));
				node.attr("x", getEditorValue("x"));
				node.attr("y", getEditorValue("y"));
				node.attr("layer", getEditorValue("layer"));
				node.attr("dir", getEditorValue("dir"));
				node.attr("stance", getEditorValue("stance"));
				node.find("alias").attr("actor", getEditorValue("actor"));
				node.find("alias").text(getEditorValue("alias"));

				updateObject(typeSelected, indexSelected);
				generateLayerMenu();

				break;
			case "prop":
				node = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");

				node.attr("id", getEditorValue("id"));
				node.attr("template", getEditorValue("template"));
				node.attr("x", getEditorValue("x"));
				node.attr("y", getEditorValue("y"));
				node.attr("layer", getEditorValue("layer"));
				node.attr("dir", getEditorValue("dir"));
				node.attr("stance", getEditorValue("stance"));

				updateObject(typeSelected, indexSelected);
				generateLayerMenu();

				break;
			case "trace":
				node = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");

				node.attr("id", getEditorValue("id"));
				node.attr("type", getEditorValue("type"));
				node.attr("reference", getEditorValue("reference"));
				node.attr("vertices", getEditorValue("vertices"));

				generateLayerMenu();
				drawTraces();

				break;
			default:
				console.log("unrecognized editor type: " + editorOpen);
		}

		$("#XMLEditorBack").hide();
	});

	$("#deleteThing").click(function(event) {
		if(!confirm("Are you sure you want to delete this?")) return;

		if(editorOpen == "enterFunction" || editorOpen == "exitFunction") {
			$levelXML.find(mainBoardPrg).text("");
			return;
		}

		var node = $levelXML.find(typeSelected + ":eq(" + indexSelected + ")");
		node.remove();

		$("#" + typeSelected + indexSelected).remove();

		var i = indexSelected;
		i++;
		var element = $("#" + typeSelected + i);
		while(element.length > 0)
		{
			element.attr("id", typeSelected + (i - 1));
			i++;
			element = $("#" + typeSelected + i);
		}

		//Redraw menu
		generateLayerMenu();
		drawTraces();

		$("#XMLEditorBack").hide();
	});
});
