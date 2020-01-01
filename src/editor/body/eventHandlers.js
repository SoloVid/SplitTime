$(document).on('dragstart', 'img', function(event) { event.preventDefault(); });

document.onContextMenu = function()
{
	console.log("caught context menu");
	return false;
};

$("#spriteEverything").contextmenu(function(event) { event.preventDefault(); });
$("#XMLEditor").contextmenu(function(event) { event.preventDefault(); });

$(document).keydown(function(event) {
	if(event.keyCode == 16)
	{
		ctrlDown = true;
	}

	switch(event.keyCode)
	{
		case 37:
		{
			moveFollower(-1, 0);
			break;
		}
		case 38:
		{
			moveFollower(0, -1);
			break;
		}
		case 39:
		{
			moveFollower(1, 0);
			break;
		}
		case 40:
		{
			moveFollower(0, 1);
			break;
		}
	}
});
$(document).keypress(function(event)
{
	if(event.which == 32)
	{
		console.log("export of editor:\n" + spriteCode);

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

var mode = "child";

var typeSelected;
var indexSelected;

$("#XMLEditor").hide();

$(document).on("load", "#staticScript", function() {
	t = new SplitTime.Body();
	ctx.fillStyle = "#CD96CD";
	ctx.fillRect(5, 5, t.xres - 10, t.yres - 10);
	subImg = subImg.toDataURL();
	ctx = subImg2.getContext("2d");
	ctx.fillStyle = "rgba(0, 0, 0, 0)";
	ctx.fillRect(0, 0, 320, 320);
	subImg2 = subImg2.toDataURL();
});

var subImg = document.getElementById("subImg");
var ctx = subImg.getContext("2d");
var subImg2 = document.getElementById("subImg2");

var color = "rgb(255, 0, 0)";

var mouseX = 0;
var mouseY = 0;

var mouseDown = false;

var ctrlDown = false;

var follower = null;

var pathInProgress = false;

$("#fileChooser").change(function(evt) {
	spriteFile = this.value.replace(/.+\\/, "").replace(".js", ".tjs");

	cEvent = evt; //Set for r.onload
	var f = evt.target.files[0];
	if (f) {
	  var r = new FileReader();
	  r.onload = function(e) {
		var contents = e.target.result;
		reset(contents);
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
$("#btnCodeEditor").click(function(event) {
	$("#hardCode").val(spriteCode);
	$("#XMLEditor").show();
});


function moveFollower(dx, dy) {
	if(!follower)
		return;

	var pos, x, y, i, regex;

	if(mode == "child")
	{
		pos = $(follower).position();
		x = pos.left + (dx);
		y = pos.top + (dy);
		follower.style.left = x + "px";
		follower.style.top = y + "px";

		//Locate index of element
		var thisType = follower.className;
		regex = /[\s]*draggable[\s]*/;
		thisType = thisType.replace(regex, "");

		i = /[\d]+/.exec(follower.id)[0];

		matchObjectCodeToPosition(i, x, y);

	}
	else if(mode == "base")
	{
		pos = $(follower).position();
		x = pos.left + (dx);
		y = pos.top + (dy);
		follower.style.left = x + "px";
		follower.style.top = y + "px";

		var baseOffX = BASE_BORDER_WIDTH + x - (Math.round(getBodyXRes()/2) - Math.round(getBodyProperty("baseLength")/2));
		var baseOffY = BASE_BORDER_WIDTH + y - (getBodyYRes() - getBodyProperty("baseLength")/2);

		spriteCode = spriteCode.replace(/t\.prototype\.baseOffX = -?[\d]+;/, "t.prototype.baseOffX = " + baseOffX + ";");
		spriteCode = spriteCode.replace(/t\.prototype\.baseOffY = -?[\d]+;/, "t.prototype.baseOffY = " + baseOffY + ";");

		for(i = 0; i < getChildCount(); i++)
		{
			pos = $("#childBody" + i).position();
			matchObjectCodeToPosition(i, pos.left, pos.top);
		}

		regex = /(t\.prototype\.addStaticTrace.+?|\)\s?)\((-?[\d]+), (-?[\d]+)/g;
		//console.log("started with pointstring: " + pointString);
	 	spriteCode = spriteCode.replace(regex, function(match, p0, p1, p2) {
			var newX = Number(p1) - dx;
			var newY = Number(p2) - dy;
			return p0 + "(" + newX + ", " + newY;
		});

	}
}

function matchObjectCodeToPosition(i, x, y) {
	var t = getChildObjectTemplateFromBlock(getChildObjectBlock(i));

	var x0 = getOriginX();
	var y0 = getOriginY();
	//engineX = x + t.xres/2 + t.baseOffX;
	engineX = -x0 + x + Math.round(t.xres/2) + t.baseOffX;
	//engineY = y + t.yres - t.baseLength/2 + t.baseOffY;
	engineY = -y0 + y + t.yres - Math.round(t.baseLength/2) + t.baseOffY;

	//Update XML
	regex = /child\.setX\(-?[\d]+\);/g;
	spriteCode = SLVD.strReplaceNth(spriteCode, i, regex, "child.setX(" + engineX + ");");
	regex = /child\.setY\(-?[\d]+\);/g;
	spriteCode = SLVD.strReplaceNth(spriteCode, i, regex, "child.setY(" + engineY + ");");
}

$(document).mousemove(function(event) {
	if(follower && mouseDown)
	{
		if(mode == "trace")
		{
			var dx = event.pageX - mouseX;
			var dy = event.pageY - mouseY;

			var lineRegex = /t\.prototype\.addStaticTrace\(.+?\);/g;
			var oldLine = spriteCode.match(lineRegex)[follower];

			var coordRegex = /\((-?\d+), (-?\d+)\)/g;
			var newLine = oldLine.replace(coordRegex, function(match, p1, p2) {
				var newX = Number(p1) + dx;
				var newY = Number(p2) + dy;
				return "(" + newX + ", " + newY + ")";
			});

			spriteCode = SLVD.strReplaceNth(spriteCode, follower, lineRegex, newLine);

			drawTraces(follower);//FromBackup(follower);
		}
		else
		{
			var pos = $(follower).position();
			moveFollower(event.pageX - mouseX, event.pageY - mouseY);
		}
	}

	mouseX = event.pageX;
	mouseY = event.pageY;
});

$(document.body).on("mousedown", "#spriteBase", function(event) {
	if(mode == "base")
	{
		mousedown = true;
		follower = this;
	}
});

$(document.body).on("mousedown", ".draggable", function(event) {
	if(mode != "trace" && event.which == 1)
	{
		if(ctrlDown)
		{
			return;
			//Locate index of element
			// var thisType = this.className;
			// var regex = /[\s]*draggable[\s]*/;
			// thisType = thisType.replace(regex, "");
			//
			// var activeLayer = document.getElementById("activeLayer").value;
			//
			// var i = /[\d]+/.exec(this.id)[0];
			//
			// cloneIndex = 0;
			// while(document.getElementById(thisType + cloneIndex)) { cloneIndex++; }
			//
			//
			// var XMLNode = levelXML.getElementsByTagName(thisType)[i];
			//
			// var template = XMLNode.getAttribute("template");
			//
			// var t = loadBodyFromTemplate(template);
			//
			// var HTMLClone = this.cloneNode(true);
			// HTMLClone.id = thisType + cloneIndex;
			// var XMLClone = XMLNode.cloneNode(true);
			//
			// document.getElementById("layers").getElementsByClassName("layerDisplay")[activeLayer].appendChild(HTMLClone);
			//
			// levelXML.getElementsByTagName(thisType + "s")[0].appendChild(XMLClone);
			//
			// follower = HTMLClone;
			//
			// generateLayerMenu();
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
	//follower = null;
});

$(document.body).on("mousedown", "#spriteEverything", function(event) {
	mouseDown = true;

	var pos = $(this).position();

	if(mode == "trace")
	{
		if(event.which == 1)
		{
			if(pathInProgress === false)
			{
				var traceIndexClicked = findTrace(mouseX - pos.left, mouseY - pos.top);
				//console.log("clicked trace: " + traceIndexClicked);

				if(traceIndexClicked < 0) return;

				if(ctrlDown)
				{
					follower = getTraceCount();
					addNewTrace(getTraceString(traceIndexClicked), getTraceColor(traceIndexClicked));
				}
				else
				{
					follower = traceIndexClicked;
				}
				drawTraces(follower, "whiteboard");
				//drawTracesFromBackup(follower);
			}
			else
			{
				replaceTraceString(pathInProgress, getTraceString(pathInProgress) + " (" + Math.floor((-getOriginX() + mouseX - pos.left)) + ", " + Math.floor((-getOriginY() + mouseY - pos.top)) + ")");
				drawTraces();
			}
		}
		else if(event.which == 3)
		{
			if(pathInProgress === false)
			{
				var traceStr = "(" + Math.floor((-getOriginX() + mouseX - pos.left)) + ", " + Math.floor((-getOriginY() + mouseY - pos.top)) + ")";

				pathInProgress = getTraceCount();
				addNewTrace(traceStr, color);

				drawTraces();
			}
			else
			{
				if(!ctrlDown)
				{
					replaceTraceString(pathInProgress, getTraceString(pathInProgress) + " (close)");
				}
				pathInProgress = false;
				drawTraces();
			}
		}

		//drawTraces();
	}
	else if(mode == "child")
	{
		if(event.which == 1)
		{

		}
		else if(event.which == 3)
		{
			createObject();
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

$(document).mouseup(function() { /*follower = null;*/ mouseDown = false; });

$("#saveChanges").click(function(event)
{
	//Save node info
	// var node = levelXML.getElementsByTagName(typeSelected)[indexSelected];
	//
	// node.textContent = $("#hardCode").val();
	// node.setAttribute("template", $("#template").val());

	spriteCode = $("#hardCode").val();
	reset(spriteCode);

	$("#XMLEditor").hide();

	//Update graphics
	// if(typeSelected == "NPC" || typeSelected == "prop")
	// {
	// 	updateObject(typeSelected, indexSelected);
	// 	generateLayerMenu();
	// }
	// else
	// {
	// 	generateLayerMenu();
	// 	drawTraces();
	// }
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

	//Redraw menu
	generateLayerMenu();
	drawTraces();
});

$("#closeXMLEditor").click(function(event)
{
	$("#XMLEditor").hide();
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
