dependsOn("../HUDRenderer.js");
dependsOn("Dialog.js");

SplitTime.Dialog.Renderer = {};

SplitTime.HUD.pushRenderer(SplitTime.Dialog.Renderer);

/**
 * @type {DialogDrawing[]}
 */
var dialogDrawings = [];

SplitTime.Dialog.Renderer.show = function(dialog) {
    dialogDrawings.push(new DialogDrawing(dialog));
};

SplitTime.Dialog.Renderer.hide = function(dialog) {
	for(var i = 0; i < dialogDrawings.length; i++) {
		if(dialogDrawings[i].dialog === dialog) {
			dialogDrawings[i].in = false;
		}
	}
};

SplitTime.Dialog.Renderer.notifyFrameUpdate = function() {
    for(var i = dialogDrawings.length - 1; i >= 0; i--) {
        var drawing = dialogDrawings[i];
        if(drawing.in) {
        	drawing.visibility = Math.min(drawing.visibility + 0.1, 1);
		} else {
        	drawing.visibility -= 0.1;
        	if(drawing.visibility < 0) {
        		dialogDrawings.splice(i, 1);
			}
		}
    }
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Dialog.Renderer.render = function(ctx) {
    for(var i = 0; i < dialogDrawings.length; i++) {
        // TODO: visibility
		var drawing = dialogDrawings[i];
		var dialog = drawing.dialog;
		var location = dialog.getLocation();
		sayFromBoardFocalPoint(ctx, {x: location.getX(), y: location.getY()},
			dialog.getFullCurrentLine(), dialog.getDisplayedCurrentLine(), dialog.getSpeaker());
    }
};

/**
 * @param {SplitTime.Dialog} dialog
 * @class
 */
function DialogDrawing(dialog) {
	this.dialog = dialog;
	this.in = true;
	this.visibility = 0;
}

/**
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} [pointX]
 * @param {number} [pointY]
 * @param {boolean} [isDown]
 */
function drawAwesomeRect(left, top, right, bottom, ctx, pointX, pointY, isDown) {
	ctx.beginPath();
	ctx.moveTo(left + 10, top);
	if(pointX && pointY && isDown) {
		ctx.lineTo((left + right)/2 - 10, top);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo((left + right)/2 + 10, top);
	}
	ctx.lineTo(right - 10, top);
	ctx.arc(right - 10, top + 10, 10, 1.5*Math.PI, 0, false);
	ctx.lineTo(right, bottom - 10);
	ctx.arc(right - 10, bottom - 10, 10, 0, 0.5*Math.PI, false);
	if(pointX && pointY && !isDown) {
		ctx.lineTo((left + right)/2 + 10, bottom);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo((left + right)/2 - 10, bottom);
	}
	ctx.lineTo(left + 10, bottom);
	ctx.arc(left + 10, bottom - 10, 10, 0.5*Math.PI, Math.PI, false);
	ctx.lineTo(left, top + 10);
	ctx.arc(left + 10, top + 10, 10, Math.PI, 1.5*Math.PI, false);
	ctx.closePath();

	ctx.strokeStyle = "rgba(255, 255, 255, .8)";
	ctx.lineWidth = 3;
	ctx.stroke();

	var grd = ctx.createLinearGradient(0, top, 0, bottom);
	grd.addColorStop(0, "rgba(50, 100, 200, .4)");
	grd.addColorStop(0.5, "rgba(50, 100, 220, .9)");
	grd.addColorStop(1, "rgba(50, 100, 200, .4)");
	ctx.fillStyle = grd;
	ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} focalPoint
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {string} speakerName
 */
function sayFromBoardFocalPoint(ctx, focalPoint, fullMessage, displayedMessage, speakerName) {
	var pointRelativeToScreen = SplitTime.BoardRenderer.getRelativeToScreen(focalPoint);
    drawSpeechBubble(ctx, fullMessage, displayedMessage, speakerName, pointRelativeToScreen.x, pointRelativeToScreen.y);
}

var FONT_SIZE = 18;
var FONT = FONT_SIZE + "px Verdana";
var MAX_ROW_LENGTH = 500;
var MIN_ROW_LENGTH_SPLIT = 100;
var LINE_SPACING = 2;
var IDEAL_TAIL_HEIGHT = 70;
var TEXT_BOX_PADDING = 10;
var IDEAL_HEIGHT_TO_WIDTH = 9/16;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {string} [speakerName]
 * @param {number} [pointX]
 * @param {number} [pointY]
 */
function drawSpeechBubble(ctx, fullMessage, displayedMessage, speakerName, pointX, pointY) {
    // TODO: isn't top what we want here? but it looks funny
    ctx.textBaseline = "hanging";
    ctx.font=FONT;

    var textHeight = getLineHeight(ctx);
    var lineHeight = textHeight + LINE_SPACING;

    var nameWidth = 0;
    if(speakerName) {
        nameWidth = ctx.measureText(speakerName).width;
    }
    var singleLineWidth = ctx.measureText(fullMessage).width;
    var singleLineArea = singleLineWidth * lineHeight;
    var proposedWidth = Math.round(Math.sqrt(singleLineArea / IDEAL_HEIGHT_TO_WIDTH) + 3*lineHeight);

    var maxTextWidth = Math.min(MAX_ROW_LENGTH, Math.max(MIN_ROW_LENGTH_SPLIT, nameWidth, proposedWidth));
    var lines = getLinesFromMessage(fullMessage, displayedMessage, ctx, maxTextWidth);

    var bubbleWidth = Math.max(lines.maxWidth, nameWidth) + 2*TEXT_BOX_PADDING;
    var halfBubbleWidth = bubbleWidth / 2;
    var bubbleMidPointX = SplitTime.SCREENX/2;
    var wholeBubbleTextHeight = lines.all.length * lineHeight;
    var bubbleHeight = wholeBubbleTextHeight + 2*TEXT_BOX_PADDING;

    var isAbovePoint = true;
	var top = pointY - (bubbleHeight + IDEAL_TAIL_HEIGHT);
	if(bubbleHeight + 50 > pointY) {
		isAbovePoint = false;
		top = pointY + 40;
		pointY += 35;
	}
	if(!pointY) {
		top = 0;
	}
	var messageTop = top;

    if(speakerName) {
    	var namePadding = TEXT_BOX_PADDING;
    	var nameBoxHeight = textHeight + 2*namePadding;
    	var nameBoxWidth = nameWidth + 2*namePadding;
    	var nameBoxLeft = bubbleMidPointX - halfBubbleWidth;
        //Name box
        drawAwesomeRect(nameBoxLeft, top, nameBoxLeft + nameBoxWidth, top + nameBoxHeight, ctx);

        ctx.fillStyle="#FFFFFF";
        //Name
        ctx.fillText(speakerName, nameBoxLeft + namePadding, top + namePadding);

        messageTop += nameBoxHeight;
    }

	//Text box
	drawAwesomeRect(bubbleMidPointX - halfBubbleWidth, messageTop, bubbleMidPointX + halfBubbleWidth, messageTop + bubbleHeight, ctx, pointX, pointY, !isAbovePoint);

    ctx.fillStyle="#FFFFFF";
    //Lines
	for(var index = 0; index < lines.displayed.length; index++) {
		ctx.fillText(lines.displayed[index], bubbleMidPointX - halfBubbleWidth + TEXT_BOX_PADDING, messageTop + lineHeight*index + TEXT_BOX_PADDING);
	}
}

/**
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} maxRowLength
 * @return {{maxWidth: number, all: string[], displayed: string[]}}
 */
function getLinesFromMessage(fullMessage, displayedMessage, ctx, maxRowLength) {
    var initialFont = ctx.font;
    ctx.font = FONT;

    function getLine(str) {
        if(!str) {
            return null;
        }
        var words = str.split(" ");
        var nextWord = words.shift();
        var line = nextWord;
        var width = ctx.measureText(line).width;
        while(words.length > 0 && width < maxRowLength) {
        	nextWord = words.shift();
        	line += " " + nextWord;
            width = ctx.measureText(line).width;
		}

		if(width > maxRowLength && line !== nextWord) {
        	words.unshift(nextWord);
        	line = line.substr(0, line.length - (nextWord.length + 1));
		}

        return line;
    }

    var allLines = [];
    var displayedLines = [];
    var maxWidth = 0;

    var remainingFullMessage = fullMessage;
    var remainingDisplayedMessage = displayedMessage;
    while(remainingFullMessage.length > 0) {
        var i = allLines.length;
        allLines[i] = getLine(remainingFullMessage);
        displayedLines[i] = allLines[i].substring(0, remainingDisplayedMessage.length);
        remainingFullMessage = remainingFullMessage.substring(allLines[i].length).trim();
        remainingDisplayedMessage = remainingDisplayedMessage.substring(displayedLines[i].length).trim();
        maxWidth = Math.max(maxWidth, ctx.measureText(allLines[i]).width);
    }

    ctx.font = initialFont;

    return {
    	maxWidth: maxWidth,
    	all: allLines,
		displayed: displayedLines
	};
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @return {number}
 */
function getLineHeight(ctx) {
   return FONT_SIZE;
}