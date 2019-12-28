/**
 *
 * @param {string} speaker
 * @param {string[]} lines
 * @param {LevelLocation} [location]
 * @constructor
 */
SplitTime.Dialog = function(speaker, lines, location) {
	this._speaker = speaker;
	this._lines = lines;
	this.setLocation(location);
	this._currentLine = 0;
	this._charactersDisplayed = 0;
	this._startDelay = null;
	this._isFinished = false;
};

SplitTime.Dialog.AdvanceMethod = {
	AUTO: "AUTO",
	INTERACTION: "INTERACTION",
    HYBRID: "HYBRID"
};
var AdvanceMethod = SplitTime.Dialog.AdvanceMethod;

SplitTime.Dialog.prototype._advanceMethod = SplitTime.Dialog.AdvanceMethod.HYBRID;
/**
 *
 * @type {number}
 */
SplitTime.Dialog.prototype._delay = 2000;
SplitTime.Dialog.prototype._speed = 25;

/**
 * @return {LevelLocation}
 */
SplitTime.Dialog.prototype.getLocation = function() {
	return this._location;
};
/**
 * @param {LevelLocation} location
 */
SplitTime.Dialog.prototype.setLocation = function(location) {
    this._location = location;
    this._refreshSignaler();
};

SplitTime.Dialog.prototype.setAdvanceMethod = function(advanceMethod, delay) {
    this._advanceMethod = advanceMethod;
    this._delay = delay || this._delay;
};

SplitTime.Dialog.prototype.getSpeaker = function() {
    return this._speaker;
};

SplitTime.Dialog.prototype.getFullCurrentLine = function() {
    return this._lines[this._currentLine];
};

SplitTime.Dialog.prototype.getDisplayedCurrentLine = function() {
    return this.getFullCurrentLine().substr(0, this._charactersDisplayed);
};

SplitTime.Dialog.prototype.notifyFrameUpdate = function() {
	if(this._signaler.isSignaling()) {
		this.step();
	}
};

/**
 * TODO: potentially support multiple
 * @param {PlayerInteractHandler} handler
 */
SplitTime.Dialog.prototype.registerPlayerInteractHandler = function(handler) {
    this._playerInteractHandler = handler;
};

/**
 * TODO: potentially support multiple
 * @param {DialogEndHandler|function} handler
 */
SplitTime.Dialog.prototype.registerDialogEndHandler = function(handler) {
    this._dialogEndHandler = handler;
};

SplitTime.Dialog.prototype.onPlayerInteract = function() {
	if(this._playerInteractHandler) {
		this._playerInteractHandler.onPlayerInteract(this);
	} else if(this._advanceMethod === AdvanceMethod.INTERACTION || this._advanceMethod === AdvanceMethod.HYBRID) {
		this.advance();
	}
};

SplitTime.Dialog.prototype.start = function() {
    SplitTime.DialogManager.submit(this);
};

SplitTime.Dialog.prototype.advance = function() {
    this._startDelay = null;
    if(this._isFinished) {
        this.close();
    } else if(this._charactersDisplayed < this._getCurrentLineLength()) {
        this._charactersDisplayed = this._getCurrentLineLength();
    } else {
        if(this._currentLine + 1 < this._lines.length) {
            this._currentLine++;
            this._charactersDisplayed = 0;
        } else {
            this._isFinished = true;
        }
    }
};

/**
 * Move forward one frame relative to the dialog speed
 */
SplitTime.Dialog.prototype.step = function() {
    if(this._charactersDisplayed < this._getCurrentLineLength()) {
        this._charactersDisplayed++;
    } else if(this._advanceMethod === AdvanceMethod.AUTO || this._advanceMethod === AdvanceMethod.HYBRID) {
        if(!this._startDelay) {
            this._startDelay = this._getTimeMs();
        } else if(this._getTimeMs() > this._startDelay + this._delay) {
            this.advance();
        }
    }
};

SplitTime.Dialog.prototype.close = function() {
     SplitTime.DialogManager.remove(this);
     if(this._dialogEndHandler) {
         if(typeof this._dialogEndHandler === "function") {
             this._dialogEndHandler(this);
         } else if(typeof this._dialogEndHandler.onDialogEnd === "function") {
             this._dialogEndHandler.onDialogEnd(this);
         } else {
             console.error("Invalid dialog end handler: ", this._dialogEndHandler);
         }
	 }
};

SplitTime.Dialog.prototype.isFinished = function() {
    return this._isFinished;
};

SplitTime.Dialog.prototype._refreshSignaler = function() {
    if(this._location) {
        this._signaler = this._location.getLevel().getRegion().getTimeStabilizer(this._getMsPerStep());
    } else {
    	this._signaler = new SplitTime.FrameStabilizer(this._getMsPerStep());
	}
};

SplitTime.Dialog.prototype._getTimeMs = function() {
    if(this._location) {
        return this._location.getLevel().getRegion().getTimeMs();
    } else {
        return +(new Date());
    }
};

SplitTime.Dialog.prototype._getMsPerStep = function() {
	return Math.round(1000 / this._speed);
};

SplitTime.Dialog.prototype._getCurrentLineLength = function() {
    return this._lines[this._currentLine].length;
};
