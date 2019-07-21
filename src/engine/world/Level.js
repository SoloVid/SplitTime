var ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL";
var EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL";

/**
 * @param {string} levelId
 * @constructor
 * @property {ImageData[]} layerFuncData
 */
SplitTime.Level = function(levelId) {
    this.id = levelId;
    this.functions = {};
    this.positions = {};
    this.region = null;
    /** @type SplitTime.Body[] */
    this.bodies = [];
    this.loadPromise = new SLVD.Promise();
    this.background = "";
    /** @type ImageData[] */
    this.layerFuncData = [];

    this._bodyOrganizer = new SplitTime.Level.BodyOrganizer();

    /** @type {SplitTime.WeatherRenderer} */
    this.weatherRenderer = new SplitTime.WeatherRenderer();
};

SplitTime.Level.load = function(levelData) {
    var levelName = levelData.fileName.replace(/\.json$/, "");
    var level = SplitTime.Level.get(levelName);
    return level.load(levelData);
};

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

        that._bodyOrganizer.initialize(that);
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
 * @return {SplitTime.Level.BodyOrganizer}
 */
SplitTime.Level.prototype.getBodyOrganizer = function() {
    return this._bodyOrganizer;
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
    return debugTraceCanvas;
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
    this.registerFunction(ENTER_LEVEL_FUNCTION_ID, fun);
};

SplitTime.Level.prototype.registerExitFunction = function(fun) {
    this.registerFunction(EXIT_LEVEL_FUNCTION_ID, fun);
};

SplitTime.Level.prototype.registerFunction = function(functionId, fun) {
    this.functions[functionId] = fun;
};

SplitTime.Level.prototype.registerPosition = function(positionId, position) {
    this.positions[positionId] = position;
};

SplitTime.Level.prototype.getFunctionIdFromPixel = function(r, g, b, a) {
    var functionIntId = SplitTime.Trace.getFunctionIdFromColor(r, g, b, a);
    return this.internalFunctionIdMap[functionIntId];
};

SplitTime.Level.prototype.runFunctionFromBodyCrossPixel = function(body, r, g, b, a) {
    var functionIntId = SplitTime.Trace.getFunctionIdFromColor(r, g, b, a);
    var functionStringId = this.internalFunctionIdMap[functionIntId];
    return this.runFunction(functionStringId, body);
};

SplitTime.Level.prototype.runFunction = function(functionId, param) {
    var that = this;
    var fun = this.functions[functionId] || function() {
        console.warn("Function \"" + functionId + "\" not found for level " + that.id);
    };
    return fun(param);
};

SplitTime.Level.prototype.runFunctions = function(functionIds, param) {
    for(var i = 0; i < functionIds.length; i++) {
        this.runFunction(functionIds[i], param);
    }
};
SplitTime.Level.prototype.runFunctionSet = function(functionIdSet, param) {
    for(var id in functionIdSet) {
        this.runFunction(id, param);
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
 *
 * @param {SplitTime.Agent.Callback} callback
 */
SplitTime.Level.prototype.forEachAgent = function(callback) {
    var bodies = this._bodyOrganizer.getBodies();
    for(var i = 0; i < bodies.length; i++) {
        var agent = bodies[i].getAgent();
        if(agent) {
            callback(agent);
        }
    }
};

/**
 * @returns {SplitTime.Body[]}
 */
SplitTime.Level.prototype.getBodies = function() {
    // TODO: implement
    //return this.bodies;
	return this._bodyOrganizer.getBodies();
};

//Sort all board characters into the array this.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.Level.prototype.refetchBodies = function() {
    this._bodyOrganizer = new SplitTime.Level.BodyOrganizer(this);
    this.bodies.length = 0;
    var index;
    //Figure out which Actors are on board
    for(var id in SplitTime.Actor) {
        var actor = SplitTime.Actor[id];
        if(actor.getLevel() === this) {
            // this._bodyOrganizer.removeBody(actor);
            this.insertBody(actor, true);
        }
    }

    var me = this;
    function putObjOnBoard(obj) {
        me.insertBody(obj);
        var children = obj.getChildren();
        for(var i = 0; i < children.length; i++) {
            putObjOnBoard(children[i]);
        }
    }

    //Pull board objects from file
    for(index = 0; index < this.fileData.props.length; index++) {
        var prop = this.fileData.props[index];
        var template = prop.template;

        var obj = SplitTime.Body.getTemplateInstance(template);
        if(obj) {
            obj.id = prop.id;
            obj.put(this, +prop.x, +prop.y, +prop.z);
            obj.dir = isNaN(prop.dir) ? SplitTime.Direction.fromString(prop.dir) : +prop.dir;
            obj.stance = prop.stance;

            putObjOnBoard(obj);
        } else {
            console.error("Template \"" + template + "\" not found for instantiating prop");
        }
    }

    // TODO: better implementation of players
    // for(index = 0; index < SplitTime.player.length; index++) {
    //     if(index == SplitTime.currentPlayer || this.type == "TRPG") {
    //         this.agents.push(SplitTime.player[index]);
    //         this.insertBody(SplitTime.player[index]);
    //     }
    // }
};

//Sort the array this.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.Level.prototype.sortBodies = function() {
    if(this.bodies.length === 0) this.refetchBodies();
    else {
        for(var index = 1; index < this.bodies.length; index++) {
            var second = index;
            while(second > 0 && this.bodies[second].y < this.bodies[second - 1].y) {
                var tempC = this.bodies[second];
                this.bodies[second] = this.bodies[second - 1];
                this.bodies[second - 1] = tempC;
                second--;
            }
        }
    }
};

/**
 * @deprecated Only really needed currently for rendering, which should elsewhere and different
 * @param {SplitTime.Body} body
 * @param {boolean} [skipOrganizer]
 */
SplitTime.Level.prototype.insertBody = function(body, skipOrganizer) {
    var index = 0;
    while(index < this.bodies.length && body.y > this.bodies[index].y) {
        index++;
    }
    this.bodies.splice(index, 0, body);
    // if(!skipOrganizer) {
        this._bodyOrganizer.addBody(body);
    // }
};

/**
 * @deprecated Only really needed currently for rendering, which should elsewhere and different
 * @param {SplitTime.Body} body
 */
SplitTime.Level.prototype.removeBody = function(body) {
    for(var index = 0; index < this.bodies.length; index++) {
        if(body == this.bodies[index]) {
            this.bodies.splice(index, 1);
            index = this.bodies.length;
        }
    }
    this._bodyOrganizer.removeBody(body);
};

/**
 * @param {SplitTime.Body} body
 * @param {function(ImageData)} callback
 */
SplitTime.Level.prototype.forEachRelevantTraceDataLayer = function(body, callback) {
    return this.forEachTraceDataLayerBetween(body.z, body.z + body.height, callback);
};

/**
 * @param {number} minZ
 * @param {number} exMaxZ
 * @param {function(ImageData, [int], [int])} callback
 */
SplitTime.Level.prototype.forEachTraceDataLayerBetween = function(minZ, exMaxZ, callback) {
    for(var iLayer = 0; iLayer < this.fileData.layers.length; iLayer++) {
        var layerZ = this.fileData.layers[iLayer].z;
        var nextLayer = this.fileData.layers[iLayer + 1];
        var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_SAFE_INTEGER;
        if(exMaxZ > layerZ && minZ < nextLayerZ) {
            // console.log("checking on layer " + iLayer);
            var retVal = callback(this.layerFuncData[iLayer], layerZ, nextLayerZ);
            if(retVal !== undefined) {
                return;
            }
        }
    }
};

var levelMap = {};
var currentLevel = null;

var holderCanvas;
var debugTraceCanvas;

SplitTime.Level.prototype.loadForPlay = function() {
    this.refetchBodies();

    this.internalFunctionIdMap = {};
    var nextFunctionId = 1;

    holderCanvas.width = this.width/(this.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
    holderCanvas.height = this.yWidth/(this.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
    var holderCtx = holderCanvas.getContext("2d");

    debugTraceCanvas.width = this.width;
    debugTraceCanvas.height = this.height;
    var debugTraceCtx = debugTraceCanvas.getContext("2d");
    debugTraceCtx.clearRect(0, 0, debugTraceCanvas.width, debugTraceCanvas.height);

    //Initialize functional map
    for(var iLayer = 0; iLayer < this.fileData.layers.length; iLayer++) {
        holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);

        var layerZ = this.fileData.layers[iLayer].z;
        var nextLayer = this.fileData.layers[iLayer + 1];
        var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_VALUE;
        var layerHeight = nextLayerZ - layerZ;

        //Draw traces
        var layerTraces = this.fileData.layers[iLayer].traces;

        holderCtx.translate(0.5, 0.5);

        for(var iLayerTrace = 0; iLayerTrace < layerTraces.length; iLayerTrace++) {
            var trace = layerTraces[iLayerTrace];
            var type = trace.type;
            if(type === SplitTime.Trace.Type.FUNCTION) {
                var functionStringId = trace.parameter;
                var functionIntId = nextFunctionId++;
                this.internalFunctionIdMap[functionIntId] = functionStringId;
                var color = SplitTime.Trace.getFunctionColor(functionIntId);
                SplitTime.Trace.drawColor(trace.vertices, holderCtx, color);
            } else if(type === SplitTime.Trace.Type.SOLID) {
                var height = trace.parameter || layerHeight;
                SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(height));
            } else if(type === SplitTime.Trace.Type.GROUND) {
                SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(0));
            } else if(type === SplitTime.Trace.Type.STAIRS) {
                var stairsUpDirection = trace.parameter;
                var gradient = SplitTime.Trace.calculateGradient(trace.vertices, holderCtx, stairsUpDirection);
                gradient.addColorStop(0, SplitTime.Trace.getSolidColor(0));
                gradient.addColorStop(1, SplitTime.Trace.getSolidColor(layerHeight));
                SplitTime.Trace.drawColor(trace.vertices, holderCtx, gradient);
            } else {
                SplitTime.Trace.draw(layerTraces[iLayerTrace].vertices, holderCtx, type);
            }
        }
        var bodies = this.getBodies();
        for(var iBody = 0; iBody < bodies.length; iBody++) {
            var cBody = bodies[iBody];
            if(cBody.z == iLayer) {
                for(var iStaticTrace = 0; iStaticTrace < cBody.staticTrace.length; iStaticTrace++) {
                    SplitTime.Trace.draw(cBody.staticTrace[iStaticTrace].traceStr, holderCtx, cBody.staticTrace[iStaticTrace].type, cBody);
                }
            }
        }
        holderCtx.translate(-0.5, -0.5);

        this.layerFuncData[iLayer] = holderCtx.getImageData(0, 0, this.width, this.height);

        debugTraceCtx.drawImage(holderCanvas, 0, -layerZ);
    }

    this.runFunction(ENTER_LEVEL_FUNCTION_ID);
};

SplitTime.Level.createCanvases = function(screenWidth, screenHeight) {
    holderCanvas = document.createElement("canvas");
    holderCanvas.setAttribute("width", screenWidth);
    holderCanvas.setAttribute("height", screenHeight);

    debugTraceCanvas = document.createElement("canvas");
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

/**
 * @param {SplitTime.Level|string} level
 * @return {SLVD.Promise}
 */
SplitTime.Level.setCurrent = function(level) {
    if(typeof level === "string") {
        level = SplitTime.Level.get(level);
    }

    if(level === currentLevel) {
        return SLVD.Promise.as();
    }

    var exitingLevel = currentLevel;
    currentLevel = level;

    //********Leave current board

    //TODO: give agents a chance to clean up

    // TODO: clear exiting board data; probably in context of region rather than level
    if(exitingLevel) {
        exitingLevel.runFunction(EXIT_LEVEL_FUNCTION_ID);

        // //Clear out all functional maps
        // exitingLevel.layerFuncData.length = 0;
    }

    //********Enter new board

    // TODO: This loading should take place at the region level; not the level level
    SplitTime.process = "loading";
    return currentLevel.waitForLoadAssets().then(function() {
        SplitTime.process = currentLevel.type;
        if(SplitTime.process === SplitTime.main.State.ACTION) {
            SplitTime.cTeam = SplitTime.player;
        } else if(SplitTime.process == "overworld") {
            SplitTime.cTeam = SplitTime.player;
            SplitTime.TRPGNextTurn();
        }

        currentLevel.loadForPlay();
    });
};

/**
 * @returns {SplitTime.Level}
 */
SplitTime.Level.getCurrent = function() {
    return currentLevel;
};
