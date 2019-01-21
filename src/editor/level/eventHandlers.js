var levelObject;

var mode = "position";

var typeSelected;
var indexSelected;
var color;

var mouseX = 0;
var mouseY = 0;
var mouseLevelX = 0;
var mouseLevelY = 0;
var mouseDown = false;
var ctrlDown = false;

var follower = null;
var pathInProgress = false;

var subImg;
var ctx;
var subImg2;

var projectName = window.location.hash.substring(1);
while(!projectName) {
	projectName = prompt("project folder name:");
}
window.location.hash = "#" + projectName;
var projectPath = "projects/" + projectName + "/";

var traceEditorColors = {
	"solid": "rgba(0, 0, 255, 1)",
	"void": "rgba(255, 0, 255, 1)",
	"function": "rgba(255, 0, 0, 1)",
	"path": "rgba(0, 0, 0, 1)",
	"stairDown": "rgba(0, 255, 0, 1)",
	"stairUp": "rgba(0, 255, 0, 1)",
	"highlight": "rgba(255, 255, 0, 1)"
};

$(document).ready(function() {
	for(var traceType in traceEditorColors) {
		$("#traceOptions").append('<div class="option" style="color: white; background-color: ' + traceEditorColors[traceType] + '">' + traceType + '</div>');
	}

	$.getScript(projectPath + "dist/game.js", function() {
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

		$.getScript("src/editor/level/vueSetup.js");
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
			console.log("export of level JSON:");
			console.log(JSON.stringify(levelObject, null, 4));
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

	$(document).mousemove(function(event) {
		var regex;
		if(follower) {
            var dx = event.pageX - mouseX;
            var dy = event.pageY - mouseY;
			if(mode == "trace") {
				regex = /\((-?[\d]+), (-?[\d]+)\)/g;
				var pointString = follower.vertices;
				follower.vertices = pointString.replace(regex, function(match, p1, p2) {
					var newX = Number(p1) + dx;
					var newY = Number(p2) + dy;
					return "(" + newX + ", " + newY + ")";
				});
			} else {
				follower.x += dx;
				follower.y += dy;
			}
		}

		mouseX = event.pageX;
		mouseY = event.pageY;
		var levelContainerPos = $("#layers").position();
		mouseLevelX = mouseX - levelContainerPos.left;
		mouseLevelY = mouseY - levelContainerPos.top;
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
			}
			else
			{
				follower = $(this);
			}
		}
	});
	$(document.body).on("mouseup", ".draggable", function(event) {
		follower = null;
	});

	$(document.body).on("mouseup", "#layers", function(event) {
		mouseDown = true;

		var pos = $(this).position();

		if(mode == "trace")
		{
			var closestPosition = null;
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
					} else {
						follower = traceIndexClicked;
					}
				}
				else
				{
					var oldDef = pathInProgress.text();
					pathInProgress.text(oldDef + " (" + Math.floor(mouseLevelX/getPixelsPerPixel()) + ", " + Math.floor(mouseLevelY/getPixelsPerPixel()) + ")");
				}
			}
			else if(event.which == 3)
			{
				if(!pathInProgress)
				{
					var trace = $("<trace/>", $levelXML);

					trace.attr("type", typeSelected);

					if(typeSelected == "path" && !ctrlDown) {
						closestPosition = findClosestPosition(mouseLevelX, mouseLevelY);
					}

					if(closestPosition) {
						trace.text("(pos:" + closestPosition + ")");
					}
					else {
						trace.text("(" + Math.floor(mouseLevelX/getPixelsPerPixel()) + ", " + Math.floor(mouseLevelY/getPixelsPerPixel()) + ")");
					}
					pathInProgress = trace;

					var activeLayer = $("#activeLayer").val();

					$levelXML.find("traces:eq(" + activeLayer + ")").append(trace);
				} else {
					if(!ctrlDown)
					{
						if(pathInProgress.attr("type") == "path") {
							closestPosition = findClosestPosition(mouseLevelX, mouseLevelY);
							if(closestPosition) {
								pathInProgress.text(pathInProgress.text() + " (pos:" + closestPosition + ")");
							}
						}
						else {
							pathInProgress.text(pathInProgress.text() + " (close)");
						}
					}
					pathInProgress = false;
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

	$(document).mouseup(function() {
		follower = null;
		mouseDown = false;
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

		var prop = levelObject.props[i];
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

		var position = levelObject.positions[i];
		showEditorPosition(position);
	});
});
