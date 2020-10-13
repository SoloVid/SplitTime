(window as any)["__EDITOR_CONSTANT__"] = true;

namespace splitTime.editor.level {
    export var levelObject = {
        fileName: "",
        type: "",
        region: "",
        layers: [],
        props: [],
        positions: []
    } as any;
    export var fileName = "";
    export var mode = "position";
    export var typeSelected: any;
    
    export var EDITOR_PADDING = 32;
    export var mouseX = 0;
    export var mouseY = 0;
    export var mouseLevelX = 0;
    export var mouseLevelY = 0;
    export var mouseDown = false;
    export var ctrlDown = false;
    
    export var cancelNextContextMenu = false;
    
    export var follower: any = null;
    export var lastFollower: any = null;
    export var pathInProgress: any = null;
    
    export var subImg: any;
    export var ctx: any;
    export var subImg2: any;
    
    export function setupEventHandlers() {
        window.onbeforeunload = function() {
            return true;
        };
        
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
        
        $(document).on("keydown", function(event) {
            // TODO: resolve typing
            const element = event.target as any
            switch (element.tagName.toLowerCase()) {
                case "input":
                case "textarea":
                return;
            }
            
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
            if(event.which == 16) { // shift
                ctrlDown = false;
            } else if(event.which == 27) { // esc
                console.log("export of level JSON:");
                console.log(exportLevel());
            }
        });
        
        $(document.body).on("change", "#fileChooser", function(event) {
            var f = event.target.files[0];
            if (f) {
                var r = new FileReader();
                r.onload = function(e) {
                    if (!e.target) {
                        throw new Error("No target?")
                    }
                    var contents = e.target.result;
                    if (typeof contents !== "string") {
                        throw new Error("Contents not string?")
                    }
                    console.log(contents);
                    
                    importLevel(contents);
                    fileName = f.name;
                    updatePageTitle();
                    
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
            mouseLevelX = Math.round(mouseX - levelContainerPos.left - EDITOR_PADDING);
            mouseLevelY = Math.round(mouseY - levelContainerPos.top - EDITOR_PADDING);
            
            var layerIndex = vueApp.activeLayer;
            var layer = levelObject.layers[layerIndex];
            if(layer) {
                vueApp.info.z = layer.z || 0
                vueApp.info.x = mouseLevelX
                vueApp.info.y = mouseLevelY + (vueApp.info.z || 0)
            }
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
                        var trace = addNewTrace(vueApp.activeLayer, typeSelected);
                        
                        if(typeSelected == splitTime.trace.Type.PATH && !ctrlDown) {
                            trace.vertices = positionPoint;
                        } else {
                            trace.vertices = literalPoint;
                        }
                        
                        pathInProgress = trace;
                    } else {
                        if(!ctrlDown) {
                            if(pathInProgress.type == splitTime.trace.Type.PATH) {
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
    }
}
