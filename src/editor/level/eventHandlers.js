var levelObject = {
    type: "",
    region: "",
    layers: [],
    props: [],
    positions: []
};

var mode = "position";

var typeSelected;

var mouseX = 0;
var mouseY = 0;
var mouseLevelX = 0;
var mouseLevelY = 0;
var mouseDown = false;
var ctrlDown = false;

var cancelNextContextMenu = false;

var follower = null;
var lastFollower = null;
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

    $(document.body).on("dragstart", "#layers img", function(event) {
        event.preventDefault();
    });
	$(document).on('contextmenu', function(event) {
		if(cancelNextContextMenu) {
            event.preventDefault();
        }
        cancelNextContextMenu = false;
	});
    $(document.body).on("dblclick", "#layers", function(event) {
        event.preventDefault();
    });

	setInterval(function(event) {
		if(document.getElementsByClassName("background").length > 0) {
            resizeBoardCheck(document.getElementsByClassName("background")[0]);
        }
	}, 1000);

	$(document).keydown(function(event) {

		var specialKey = true;
        switch(event.which) {
			case 16:
                ctrlDown = true;
				break;
            case 37:
                moveFollower(-1, 0);
                break;
            case 38:
                moveFollower(0, -1);
                break;
            case 39:
                moveFollower(1, 0);
                break;
            case 40:
                moveFollower(0, 1);
                break;
			default:
				specialKey = false;
        }

        if(specialKey) {
        	event.preventDefault();
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

    $(document.body).on("change", "#fileChooser", function(event) {
		var f = event.target.files[0];
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
		if(follower && mouseDown) {
            var dx = event.pageX - mouseX;
            var dy = event.pageY - mouseY;
			moveFollower(dx, dy);
            event.preventDefault();
        }

		mouseX = event.pageX;
		mouseY = event.pageY;
		var levelContainerPos = $("#layers").position();
		mouseLevelX = mouseX - levelContainerPos.left;
		mouseLevelY = mouseY - levelContainerPos.top;
	});

    $(document.body).on("dblclick", "#layers", function(event) {
    	event.preventDefault();
    });

	$(document.body).on("mouseup", "#layers", function(event) {
		var z = levelObject.layers[vueApp.activeLayer].z;
		var yOnLayer = mouseLevelY + z;
		if(mode == "trace") {
            var literalPoint = "(" + Math.floor(mouseLevelX/getPixelsPerPixel()) + ", " + Math.floor(mouseLevelY/getPixelsPerPixel() + z) + ")";
			var closestPosition = findClosestPosition(mouseLevelX, yOnLayer);
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

					if(typeSelected == SplitTime.Trace.Type.PATH && !ctrlDown) {
						trace.vertices = positionPoint;
					} else {
						trace.vertices = literalPoint;
					}

					pathInProgress = trace;
				} else {
					if(!ctrlDown) {
						if(pathInProgress.type == SplitTime.Trace.Type.PATH) {
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
                cancelNextContextMenu = true;
            }
		} else if(mode == "position" || mode == "prop") {
			if(event.which == 3) { // right click
				createObject(mode);
                cancelNextContextMenu = true;
            }
		}
	});

    $(document).mousedown(function(event) {
        mouseDown = true;
    });
	$(document).mouseup(function() {
		lastFollower = follower;
		follower = null;
		mouseDown = false;
	});
});
