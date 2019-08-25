var ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL";
var EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL";

/**
 * @param {string} levelId
 * @constructor
 * @property {ImageData[]} layerFuncData
 */
SplitTime.Level = function(levelId) {
    this.id = levelId;
    this.events = {};
    this.positions = {};
    this.region = null;
    /** @type SplitTime.Body[] */
    this.bodies = [];
    this.loadPromise = new SLVD.Promise();
    this.background = "";
    /** @type ImageData[] */
    this.layerFuncData = [];

    // this._bodyOrganizer = new SplitTime.Level.BodyOrganizer();
    /** @type SplitTime.Level.CellGrid|null */
    this._cellGrid = null;

    /** @type {SplitTime.WeatherRenderer} */
    this.weatherRenderer = new SplitTime.WeatherRenderer();

    this._addingProps = false;
    /** @type SplitTime.Body[] */
    this._props = [];
};

SplitTime.Level.load = function(levelData) {
    var levelName = levelData.fileName.replace(/\.json$/, "");
    var level = SplitTime.Level.get(levelName);
    return level.load(levelData);
};

/**
 * @param {SplitTime.LevelFileData} levelData
 * @return {SLVD.Promise.Collection}
 */
SplitTime.Level.prototype.load = function(levelData) {
    var levelLoadPromise = new SLVD.Promise.Collection();

    SplitTime.Region.get(levelData.region).addLevel(this);

    this.fileData = levelData;
    this.type = levelData.type;
    this.width = levelData.width || 0;
    this.height = levelData.height || 0;
    this.yWidth = levelData.yWidth || 0;

    this.highestLayerZ = 0;
    if(levelData.layers.length > 0) {
        this.highestLayerZ = levelData.layers[levelData.layers.length - 1].z;
    }

    var that = this;
    function onLoadImage(backgroundImg) {
        if(backgroundImg.height > that.height) {
            that.height = backgroundImg.height;
            that.yWidth = that.height + that.highestLayerZ;
        }
        if(backgroundImg.width > that.width) {
            that.width = backgroundImg.width;
        }

        if(that._cellGrid) {
            that._cellGrid.initialize(that);
        }
    }

    this.background = levelData.background;
    if(this.background) {
        var loadProm = SplitTime.Image.load(this.background).then(onLoadImage);
        levelLoadPromise.add(loadProm);
    }

    //Pull positions from file
    for(var i = 0; i < levelData.positions.length; i++) {
        var posObj = levelData.positions[i];
        var position = new SplitTime.Position(
            this,
            +posObj.x,
            +posObj.y,
            +posObj.z,
            +posObj.dir,
            posObj.stance
        );

        if(posObj.id) {
            this.registerPosition(posObj.id, position);
        } else {
            console.warn("position missing id in level: " + this.id);
        }

        // var actor = ...;
        // var alias = ...;
        //
        // if(actor && alias) {
        //     SplitTime.Actor[actor].registerPosition(alias, position);
        // }
    }

    this.setLoadPromise(levelLoadPromise);

    return levelLoadPromise;
};

SplitTime.Level.prototype.setLoadPromise = function(actualLoadPromise) {
    var me = this;
    actualLoadPromise.then(function() {
        me.loadPromise.resolve();
    });
};

SplitTime.Level.prototype.waitForLoadAssets = function() {
    return this.loadPromise;
};

/**
 * @return {SplitTime.Level.CellGrid}
 */
SplitTime.Level.prototype.getCellGrid = function() {
    return this._cellGrid;
};

/**
 * @return {SplitTime.LevelTraces}
 */
SplitTime.Level.prototype.getLevelTraces = function() {
    return this._levelTraces;
};

/**
 * @return {HTMLImageElement}
 */
SplitTime.Level.prototype.getBackgroundImage = function() {
    if(!this.background) {
        return null;
    }
    return SplitTime.Image.get(this.background);
};

SplitTime.Level.prototype.getDebugTraceCanvas = function() {
    return this._levelTraces.getDebugTraceCanvas();
};

/**
 * @return {SplitTime.Region}
 */
SplitTime.Level.prototype.getRegion = function() {
    if(!this.region) {
        console.warn("Level \"" + this.id + "\" is not assigned to a region");
        this.region = SplitTime.Region.getDefault();
    }
    return this.region;
};

/**
 * @param {string} positionId
 * @return {SplitTime.Position}
 */
SplitTime.Level.prototype.getPosition = function(positionId) {
    if(!this.positions[positionId]) {
        console.warn("Level \"" + this.id + "\" does not contain the position \"" + positionId + "\"");
        this.positions[positionId] = new SplitTime.Position(this, 0, 0, 0, SplitTime.Direction.S, "default");
    }
    return this.positions[positionId];
};

SplitTime.Level.prototype.registerEnterFunction = function(fun) {
    this.registerEvent(ENTER_LEVEL_FUNCTION_ID, fun);
};

SplitTime.Level.prototype.registerExitFunction = function(fun) {
    this.registerEvent(EXIT_LEVEL_FUNCTION_ID, fun);
};

SplitTime.Level.prototype.registerEvent = function(eventId, callback) {
    this.events[eventId] = callback;
};

SplitTime.Level.prototype.registerPosition = function(positionId, position) {
    this.positions[positionId] = position;
};

SplitTime.Level.prototype.runEvent = function(eventId, param) {
    var that = this;
    var fun = this.events[eventId] || function() {
        console.warn("Event \"" + eventId + "\" not found for level " + that.id);
    };
    return fun(param);
};

SplitTime.Level.prototype.runEvents = function(eventIds, param) {
    for(var i = 0; i < eventIds.length; i++) {
        this.runEvent(eventIds[i], param);
    }
};
SplitTime.Level.prototype.runEventSet = function(eventIdSet, param) {
    for(var id in eventIdSet) {
        this.runEvent(id, param);
    }
};

SplitTime.Level.prototype.notifyFrameUpdate = function(delta) {
    this.forEachBody(function(body) {
        body.notifyFrameUpdate(delta);
    });
};

SplitTime.Level.prototype.notifyBodyMoved = function(body) {
    if(this._cellGrid) {
        this._cellGrid.resort(body);
    }
};

/**
 *
 * @param {function(SplitTime.Body)} callback
 */
SplitTime.Level.prototype.forEachBody = function(callback) {
    for(var i = 0; i < this.bodies.length; i++) {
        callback(this.bodies[i]);
    }
};

/**
 * @returns {SplitTime.Body[]}
 */
SplitTime.Level.prototype.getBodies = function() {
    return this.bodies;
};

SplitTime.Level.prototype.refetchBodies = function() {
    // this._bodyOrganizer = new SplitTime.Level.BodyOrganizer(this);
    this._cellGrid = new SplitTime.Level.CellGrid(this);

    for(var iBody = 0; iBody < this.bodies.length; iBody++) {
        this._cellGrid.addBody(this.bodies[iBody]);
    }

    this._addingProps = true;
    //Pull board objects from file
    for(var iProp = 0; iProp < this.fileData.props.length; iProp++) {
        var prop = this.fileData.props[iProp];
        var template = prop.template;

        var obj = SplitTime.Body.getTemplateInstance(template);
        if(obj) {
            obj.id = prop.id;
            obj.put(this, +prop.x, +prop.y, +prop.z, true);
            obj.dir = isNaN(prop.dir) ? SplitTime.Direction.fromString(prop.dir) : +prop.dir;
            obj.stance = prop.stance;
            if(prop.playerOcclusionFadeFactor || +prop.playerOcclusionFadeFactor === 0) {
                obj.playerOcclusionFadeFactor = +prop.playerOcclusionFadeFactor;
            }
        } else {
            SplitTime.Logger.error("Template \"" + template + "\" not found for instantiating prop");
        }
    }
    this._addingProps = false;
};

/**
 * @deprecated Used to be related to rendering; not sure interface is still appropriate
 * @param {SplitTime.Body} body
 */
SplitTime.Level.prototype.insertBody = function(body) {
    if(this.bodies.indexOf(body) < 0) {
        this.bodies.push(body);
        if(this._addingProps) {
            this._props.push(body);
        }
    }
    if(this._cellGrid) {
        this._cellGrid.addBody(body);
    }
};

/**
 * @deprecated Used to be related to rendering; not sure interface is still appropriate
 * @param {SplitTime.Body} body
 */
SplitTime.Level.prototype.removeBody = function(body) {
    if(this._cellGrid) {
        this._cellGrid.removeBody(body);
    }
    var iBody = this.bodies.indexOf(body);
    if(iBody >= 0) {
        this.bodies.splice(iBody, 1);
    }
};

var levelMap = {};
var currentLevel = null;

SplitTime.Level.prototype.loadForPlay = function() {
    var that = this;
    return currentLevel.waitForLoadAssets().then(function() {
        that.refetchBodies();
        that._levelTraces = new SplitTime.LevelTraces(that, that.fileData);
    });
};

SplitTime.Level.prototype.unload = function() {
    //TODO: give listeners a chance to clean up

    //Clear out all functional maps and other high-memory resources
    this._levelTraces = null;
    this._cellGrid = null;

    for(var i = 0; i < this._props.length; i++) {
        // We don't just remove from this level because we don't want props to leak out into other levels.
        var l = this._props[i].getLevel();
        l.removeBody(this._props[i]);
    }
    this._props = [];
};

/**
 * @param {string} levelId
 * @returns {SplitTime.Level}
 */
SplitTime.Level.get = function(levelId) {
    if(!levelMap[levelId]) {
        levelMap[levelId] = new SplitTime.Level(levelId);
    }
    return levelMap[levelId];
};

var inTransition = false;
/** @type {SLVD.Promise} */
var transitionPromise = null;

/** @type {SplitTime.Level|null} */
var nextLevel = null;

/**
 * STOP!!! This method should ONLY be called by the main game loop.
 */
SplitTime.Level.applyTransition = function() {
    if(!inTransition) {
        return;
    }

    var exitingLevel = currentLevel;
    currentLevel = nextLevel;
    nextLevel = null;

    var changeRegion = !exitingLevel || exitingLevel.getRegion() !== currentLevel.getRegion();

    //********Leave current level

    if(exitingLevel) {
        if(exitingLevel.events[EXIT_LEVEL_FUNCTION_ID]) {
            exitingLevel.runEvent(EXIT_LEVEL_FUNCTION_ID);
        }
        if(changeRegion) {
            exitingLevel.getRegion().unloadLevels();
        }
    }

    //********Enter new level

    SplitTime.process = "loading";
    var promise = changeRegion ? currentLevel.getRegion().loadForPlay() : new SLVD.Promise.as();
    promise.then(function() {
        SplitTime.process = currentLevel.type;
        if(currentLevel.events[ENTER_LEVEL_FUNCTION_ID]) {
            currentLevel.runEvent(ENTER_LEVEL_FUNCTION_ID);
        }
        inTransition = false;
        transitionPromise.resolve();
    });
};

/**
 * @param {SplitTime.Level|string} level
 * @return {SLVD.Promise}
 */
SplitTime.Level.transition = function(level) {
    if(typeof level === "string") {
        level = SplitTime.Level.get(level);
    }

    if(inTransition) {
        throw new Error("Level transition is already in progress. Cannot transition to " + level.id);
    }

    if(level === currentLevel) {
        return SLVD.Promise.as();
    }

    inTransition = true;
    nextLevel = level;
    transitionPromise = new SLVD.Promise();
    return transitionPromise;
};

/**
 * @returns {SplitTime.Level}
 */
SplitTime.Level.getCurrent = function() {
    return currentLevel;
};
