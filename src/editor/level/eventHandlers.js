var levelObject;

var mode = "position";

var typeSelected;

var mouseX = 0;
var mouseY = 0;
var mouseLevelX = 0;
var mouseLevelY = 0;
var mouseDown = false;
var ctrlDown = false;

var follower = null;
var pathInProgress = null;

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
	"stairs": "rgba(0, 255, 0, 1)",
	"highlight": "rgba(255, 255, 0, 1)"
};

$(document).ready(function() {
	$.getScript(projectPath + "dist/game.js", function() {
		subImg = $("#subImg").get(0);
		ctx = subImg.getContext("2d");
		subImg2 = $("#subImg2").get(0);

		var t = new SplitTime.Body();
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
		if(event.which == 16) {
			ctrlDown = true;
		}
	});
	$(document).keyup(function(event) {
		if(event.which == 16) {
			ctrlDown = false;
		} else if(event.which == 32) {
			console.log("export of level JSON:");
			console.log(exportLevel());
		}
	});

	$("#fileChooser").change(function(evt) {
		var f = evt.target.files[0];
		if (f) {
			var r = new FileReader();
			r.onload = function(e) {
				var contents = e.target.result;
                console.log(contents);

                importLevel(contents);

                $("#editorTools").show();
			};
			r.readAsText(f);
		} else {
			alert("Failed to load file");
		}
	});

	$(document.body).on("click", ".option", function() {
		pathInProgress = false;
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

		event.preventDefault();
	});

	// $(document.body).on("mousedown", ".draggable", function(event) {
	// 	if(mode != "trace" && event.which == 1)
	// 	{
	// 		if(ctrlDown)
	// 		{
	// 			//Locate index of element
	// 			var thisType = this.className;
	// 			var regex = /[\s]*draggable[\s]*/;
	// 			thisType = thisType.replace(regex, "");
    //
	// 			var activeLayer = document.getElementById("activeLayer").value;
    //
	// 			var i = /[\d]+/.exec(this.id)[0];
    //
	// 			cloneIndex = $("." + thisType).length;
    //
	// 			var XMLNode = $levelXML.find(thisType + ":eq(" + i + ")");
    //
	// 			var template = XMLNode.attr("template");
    //
	// 			var t = loadBodyFromTemplate(template);
    //
	// 			var HTMLClone = this.cloneNode(true);
	// 			HTMLClone.id = thisType + cloneIndex;
	// 			var XMLClone = XMLNode.cloneNode(true);
    //
	// 			$("#layers").find(".layerDisplay:eq(" + activeLayer + ")").append(HTMLClone);
    //
	// 			$levelXML.find(thisType + "s").append(XMLClone);
    //
	// 			follower = $(HTMLClone);
	// 		}
	// 	}
	// });
    $(document.body).on("dblclick", "#layers", function(event) {
    	event.preventDefault();
    });

	$(document.body).on("mouseup", "#layers", function(event) {
		if(mode == "trace") {
            var literalPoint = "(" + Math.floor(mouseLevelX/getPixelsPerPixel()) + ", " + Math.floor(mouseLevelY/getPixelsPerPixel()) + ")";
			var closestPosition = findClosestPosition(mouseLevelX, mouseLevelY);
			var positionPoint = closestPosition ? "(pos:" + closestPosition.id + ")" : "";
			if(event.which == 1) { // left click
				if(pathInProgress) {
                    if(typeSelected == "path" && ctrlDown) {
                        pathInProgress.vertices = pathInProgress.vertices + " " + positionPoint;
                    } else {
                        pathInProgress.vertices = pathInProgress.vertices + " " + literalPoint;
                    }
				}
			} else if(event.which == 3) { // right click
				if(!pathInProgress) {
					var trace = addNewTrace(vueApp.activeLayer);
					trace.type = typeSelected;

					if(typeSelected == "path" && !ctrlDown) {
						trace.vertices = positionPoint;
					} else {
						trace.vertices = literalPoint;
					}

					pathInProgress = trace;
				} else {
					if(!ctrlDown) {
						if(pathInProgress.type == "path") {
							if(closestPosition) {
								pathInProgress.vertices = pathInProgress.vertices + " " + positionPoint;
							}
						}
						else {
                            pathInProgress.vertices = pathInProgress.vertices + " (close)";
						}
					}
					pathInProgress = null;
				}
			}
		} else if(mode == "position" || mode == "prop") {
			if(event.which == 3) { // right click
				createObject(mode);
			}
		}
	});

	$(document).mouseup(function() {
		follower = null;
		mouseDown = false;
	});
});
