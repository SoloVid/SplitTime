dependsOn("../HUDRenderer.js");
dependsOn("Dialog.js");

SplitTime.Dialog.Renderer = {};
var CONFIG = {
	OUTLINE_STYLE: "rgba(255, 255, 255, .8)",
	OUTLINE_WIDTH: 3,
	BACKGROUND_STYLE: "rgba(50, 100, 150, .4)",
	TEXT_OUTLINE_COLOR: "#000000",
	TEXT_OUTLINE_WIDTH: 5,
	TEXT_COLOR: "#FFFFFF",
	FONT_SIZE: 18,
	FONT: "Verdana",
	SPEAKER_NAMES_ENABLED: false
};
SplitTime.Dialog.Renderer.Configuration = CONFIG;

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
        	drawing.visibility = SLVD.approachValue(drawing.visibility, 1, 0.1);
        	// TODO: remove temporary hackaround bad UX
			drawing.visibility = 1;
		} else {
        	drawing.visibility -= 0.1;
            // TODO: remove temporary hackaround bad UX
            drawing.visibility = 0;
        	if(drawing.visibility <= 0) {
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
		sayFromBoardFocalPoint(ctx, {x: location.getX(), y: location.getY(), z: location.getZ()},
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
 */
function drawAwesomeRect(left, top, right, bottom, ctx, pointX, pointY) {
	var CURVE_RADIUS = 10;
	var TRI_CURVE_BUFFER = 2*CURVE_RADIUS;
	var TRI_BASE_HALF = 10;
    var horizontalMid = SLVD.constrain((2*pointX + left + right)/4, left + TRI_CURVE_BUFFER, right - TRI_CURVE_BUFFER);
    var verticalMid = SLVD.constrain((2*pointY + top + bottom)/4, top + TRI_CURVE_BUFFER, bottom - TRI_CURVE_BUFFER);

	var isLeft = false;
	var isTop = false;
	var isRight = false;
	var isBottom = false;
	if(pointX !== undefined && pointY !== undefined) {
		var dLeft = left - pointX;
		var dTop = top - pointY;
		var dRight = pointX - right;
		var dBottom = pointY - bottom;
        if(pointX < left && dLeft >= dTop && dLeft > dBottom) {
            isLeft = true;
        } else if(pointY < top && dTop > dRight) {
            isTop = true;
        } else if(pointX > right && dRight > dBottom) {
            isRight = true;
        } else if(pointY > bottom) {
            isBottom = true;
        }
    }

	ctx.beginPath();
	ctx.moveTo(left + CURVE_RADIUS, top);
	if(isTop) {
		ctx.lineTo(horizontalMid - TRI_BASE_HALF, top);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo(horizontalMid + TRI_BASE_HALF, top);
	}
	ctx.lineTo(right - CURVE_RADIUS, top);
	ctx.arc(right - CURVE_RADIUS, top + CURVE_RADIUS, CURVE_RADIUS, 1.5*Math.PI, 0, false);
    if(isRight) {
        ctx.lineTo(right, verticalMid - TRI_BASE_HALF);
        ctx.lineTo(pointX, pointY);
        ctx.lineTo(right, verticalMid + TRI_BASE_HALF);
    }
	ctx.lineTo(right, bottom - CURVE_RADIUS);
	ctx.arc(right - CURVE_RADIUS, bottom - CURVE_RADIUS, CURVE_RADIUS, 0, 0.5*Math.PI, false);
	if(isBottom) {
        ctx.lineTo(horizontalMid + TRI_BASE_HALF, bottom);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo(horizontalMid - TRI_BASE_HALF, bottom);
	}
	ctx.lineTo(left + CURVE_RADIUS, bottom);
	ctx.arc(left + CURVE_RADIUS, bottom - CURVE_RADIUS, CURVE_RADIUS, 0.5*Math.PI, Math.PI, false);
    if(isLeft) {
        ctx.lineTo(left, verticalMid + TRI_BASE_HALF);
        ctx.lineTo(pointX, pointY);
        ctx.lineTo(left, verticalMid - TRI_BASE_HALF);
    }
	ctx.lineTo(left, top + CURVE_RADIUS);
	ctx.arc(left + CURVE_RADIUS, top + CURVE_RADIUS, CURVE_RADIUS, Math.PI, 1.5*Math.PI, false);
	ctx.closePath();

	ctx.strokeStyle = CONFIG.OUTLINE_STYLE;
	ctx.lineWidth = CONFIG.OUTLINE_WIDTH;
	ctx.stroke();

	ctx.fillStyle = CONFIG.BACKGROUND_STYLE;
	ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number, z: number}} focalPoint
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {string} speakerName
 */
function sayFromBoardFocalPoint(ctx, focalPoint, fullMessage, displayedMessage, speakerName) {
	var pointRelativeToScreen = SplitTime.BoardRenderer.getRelativeToScreen(focalPoint);
    drawSpeechBubble(ctx, fullMessage, displayedMessage, speakerName, pointRelativeToScreen.x, pointRelativeToScreen.y);
}

var MAX_ROW_LENGTH = 500;
var MIN_ROW_LENGTH_SPLIT = 100;
var LINE_SPACING = 2;
var IDEAL_TAIL_LENGTH = 32;
var TEXT_BOX_PADDING = 10;
var IDEAL_HEIGHT_TO_WIDTH = 7/16;
var FOCAL_MARGIN = 20;

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
    ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT;

    var textHeight = getLineHeight(ctx);
    var lineHeight = textHeight + LINE_SPACING;

    var namePadding = TEXT_BOX_PADDING;
    var nameWidth = 0;
    var nameBoxHeight = 0;
    var nameBoxWidth = 0;
    if(CONFIG.SPEAKER_NAMES_ENABLED && speakerName) {
        nameWidth = ctx.measureText(speakerName).width;
        nameBoxHeight = textHeight + 2*namePadding;
        nameBoxWidth = nameWidth + 2*namePadding;
    }

    var maxTextWidth = calculateIdealizedMaxWidth(ctx, fullMessage, lineHeight, nameWidth);
    var lines = getLinesFromMessage(fullMessage, displayedMessage, ctx, maxTextWidth);

    var bubbleWidth = Math.max(lines.maxWidth, nameWidth) + 2*TEXT_BOX_PADDING;
    var wholeBubbleTextHeight = lines.all.length * lineHeight;
    var bubbleHeight = wholeBubbleTextHeight + 2*TEXT_BOX_PADDING;

    var position = calculateDialogPosition(bubbleWidth, bubbleHeight + nameBoxHeight, pointX, pointY);

    var messageTop = position.triPointY > position.top ? position.top + nameBoxHeight : position.top;

    //Text box
	drawAwesomeRect(position.left, messageTop, position.left + bubbleWidth, messageTop + bubbleHeight, ctx, position.triPointX, position.triPointY);

    //Lines
	for(var index = 0; index < lines.displayed.length; index++) {
		drawText(ctx, lines.displayed[index], position.left + TEXT_BOX_PADDING, messageTop + lineHeight*index + TEXT_BOX_PADDING);
	}

	// Draw speaker box afterward in case it needs to cover part of the triangle
    if(CONFIG.SPEAKER_NAMES_ENABLED && speakerName) {
		var nameTop = position.triPointY > position.top ? position.top : position.top + bubbleHeight;
		var nameBoxLeft = position.left;
        //Name box
        drawAwesomeRect(nameBoxLeft, nameTop, nameBoxLeft + nameBoxWidth, nameTop + nameBoxHeight, ctx);
		//Name
		drawText(ctx, speakerName, nameBoxLeft + namePadding, nameTop + namePadding);
    }
}

function drawText(ctx, text, x, y) {
	ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR;
	ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH;
	ctx.lineJoin="round";
	ctx.miterLimit=2;
	ctx.strokeText(text, x, y);
	ctx.fillStyle=CONFIG.TEXT_COLOR;
	ctx.fillText(text, x, y);
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} fullMessage
 * @param {number} lineHeight
 * @param {number} nameWidth
 * @return {number}
 */
function calculateIdealizedMaxWidth(ctx, fullMessage, lineHeight, nameWidth) {
    var singleLineWidth = ctx.measureText(fullMessage).width;
    var singleLineArea = singleLineWidth * lineHeight;
    var proposedWidth = Math.sqrt(singleLineArea / IDEAL_HEIGHT_TO_WIDTH) + 3*lineHeight;
    return Math.min(MAX_ROW_LENGTH, Math.max(MIN_ROW_LENGTH_SPLIT, nameWidth, proposedWidth));
}

var MIN_SCREEN_MARGIN = 10;

/**
 * @param {number} areaWidth
 * @param {number} areaHeight
 * @param {number} focalPointX
 * @param {number} focalPointY
 * @return {{left: number, top: number triPointX: number, triPointY: number}}
 */
function calculateDialogPosition(areaWidth, areaHeight, focalPointX, focalPointY) {
	// Start centered (around focal point) horizontally
	var idealLeft = SLVD.constrain(
		focalPointX - areaWidth/2, // ideal
		MIN_SCREEN_MARGIN, // left side of screen
		SplitTime.SCREENX - MIN_SCREEN_MARGIN - areaWidth // right side of screen
	);
	var left = idealLeft;

	// Try to make the dialog be above the focal point
    var top = focalPointY - (areaHeight + IDEAL_TAIL_LENGTH + FOCAL_MARGIN);
	if(top < MIN_SCREEN_MARGIN) {
		// If that is off screen, try below
		top = focalPointY + (FOCAL_MARGIN + IDEAL_TAIL_LENGTH);

		if(top + areaHeight > SplitTime.SCREENY - MIN_SCREEN_MARGIN) {
            // If below is also off screen, try switching to more of a horizontal approach
			var idealTop = SLVD.constrain(
                focalPointY - areaHeight/2, // ideal
                MIN_SCREEN_MARGIN, // top of screen
                SplitTime.SCREENY - MIN_SCREEN_MARGIN - areaHeight // bottom of screen
			);
			top = idealTop;

			// TODO: prefer away from player rather than left over right
			// Try to make dialog be to the left of focal point
			left = focalPointX - (areaWidth + IDEAL_TAIL_LENGTH + FOCAL_MARGIN);
			if(left < MIN_SCREEN_MARGIN) {
				// If that is off screen, try to the right
				left = focalPointX + (FOCAL_MARGIN + IDEAL_TAIL_LENGTH);

				if(left + areaWidth > SplitTime.SCREENX - MIN_SCREEN_MARGIN) {
                    // At this point, give up trying to avoid the focal point
                    left = idealLeft;
					top = idealTop;
				}
			}
		}
	}

	// Determine off-focal point
	var centerX = left + areaWidth/2;
	var centerY = top + areaHeight/2;
	var dx = centerX - focalPointX;
	var dy = centerY - focalPointY;
	var dist = Math.sqrt(dx*dx + dy*dy);
    var triPointX = focalPointX + dx/dist * FOCAL_MARGIN;
    var triPointY = focalPointY + dy/dist * FOCAL_MARGIN;

    return {
        left: left,
    	top: top,
		triPointX: triPointX,
		triPointY: triPointY
	};
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
	ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT;

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
   return CONFIG.FONT_SIZE;
}