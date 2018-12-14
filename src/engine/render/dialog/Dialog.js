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
};

SplitTime.Dialog.AdvanceMethod = {
	AUTO: "AUTO",
	INTERACTION: "INTERACTION"
};

SplitTime.Dialog.prototype._advanceMethod = SplitTime.Dialog.AdvanceMethod.INTERACTION;
/**
 *
 * @type {number}
 */
SplitTime.Dialog.prototype._delay = 0;
SplitTime.Dialog.prototype._speed = 10;

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
 * @param {DialogEndHandler} handler
 */
SplitTime.Dialog.prototype.registerDialogEndHandler = function(handler) {
    this._dialogEndHandler = handler;
};

SplitTime.Dialog.prototype.onPlayerInteract = function() {
	if(this._playerInteractHandler) {
		this._playerInteractHandler.onPlayerInteract(this);
	} else if(this._advanceMethod === SplitTime.Dialog.AdvanceMethod.INTERACTION) {
		this.advance();
	}
};

SplitTime.Dialog.prototype.advance = function() {
    if(this._currentLine >= this._lines.length) {
        this.close();
    } else if(this._charactersDisplayed < this._lines[this._currentLine]) {
        this._charactersDisplayed = this._lines[this._currentLine];
    } else {
        this._currentLine++;
    }
};

/**
 * Move forward one frame relative to the dialog speed
 */
SplitTime.Dialog.prototype.step = function() {
    if(this._charactersDisplayed < this._lines[this._currentLine]) {
        this._charactersDisplayed++;
    } else if(this._advanceMethod === SplitTime.Dialog.AdvanceMethod.AUTO) {
    	// TODO: implement delay
        this.advance();
    }
};

SplitTime.Dialog.prototype.close = function() {
     SplitTime.DialogManager.remove(this);
     if(this._dialogEndHandler) {
     	this._dialogEndHandler.onDialogEnd(this);
	 }
};

SplitTime.Dialog.prototype._refreshSignaler = function() {
    if(this._location) {
        this._signaler = this._location.getLevel().getRegion().getTimeStabilizer(this._getMsPerStep());
    } else {
    	this._signaler = new SplitTime.FrameStabilizer(this._getMsPerStep());
	}
};

SplitTime.Dialog.prototype._getMsPerStep = function() {
	return Math.round(1000 / this.speed);
};
