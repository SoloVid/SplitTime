namespace SplitTime {
    var ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL";
    var EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL";
    
    var levelMap = {};
    var currentLevel = null;
    
    var inTransition = false;
    /** @type {SLVD.Promise} */
    var transitionPromise: SLVD.Promise = null;
    
    /** @type {SplitTime.Level|null} */
    var nextLevel: SplitTime.Level | null = null;
    
    export class Level {
        id: any;
        events: {};
        positions: {};
        region: any;
        bodies: any[];
        loadPromise: any;
        background: string;
        layerFuncData: any[];
        _cellGrid: any;
        weatherRenderer: any;
        _addingProps: boolean;
        _props: any[];
        fileData: any;
        type: any;
        width: int = 0;
        height: int = 0;
        yWidth: int = 0;
        highestLayerZ: int;
        _levelTraces: any;
        /**
        * @param {string} levelId
        * @constructor
        * @property {ImageData[]} layerFuncData
        */
        constructor(levelId: string) {
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
        
        static load(levelData) {
            var levelName = levelData.fileName.replace(/\.json$/, "");
            var level = SplitTime.Level.get(levelName);
            return level.load(levelData);
        };
        
        /**
        * @param {SplitTime.LevelFileData} levelData
        * @return {SLVD.Promise.Collection}
        */
        load(levelData: SplitTime.level.FileData): SLVD.PromiseCollection {
            var levelLoadPromise = new SLVD.PromiseCollection();
            
            SplitTime.Region.get(levelData.region).addLevel(this);
            
            this.fileData = levelData;
            this.type = levelData.type;
            // this.width = levelData.width || 0;
            // this.height = levelData.height || 0;
            // this.yWidth = levelData.yWidth || 0;
            
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
                var loadProm = SplitTime.image.load(this.background).then(onLoadImage);
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
                
                for(var iLayer = 0; iLayer < levelData.layers.length; iLayer++) {
                    var layerTraces = levelData.layers[iLayer].traces;
                    for(var iLayerTrace = 0; iLayerTrace < layerTraces.length; iLayerTrace++) {
                        var rawTrace = layerTraces[iLayerTrace];
                        var type = rawTrace.type;
                        switch(type) {
                            case SplitTime.Trace.Type.TRANSPORT:
                                var trace = SplitTime.Trace.fromRaw(rawTrace);
                                var transportTraceId = trace.getLocationId();
                                this.registerEvent(transportTraceId, (function(trace) {
                                    return function(body) {
                                        body.put(trace.level, body.x + trace.offsetX, body.y + trace.offsetY, body.z + trace.offsetZ);
                                    };
                                } (trace)));
                        }
                    }
                }

                this.setLoadPromise(levelLoadPromise);
                
                return levelLoadPromise;
            };
            
            setLoadPromise(actualLoadPromise) {
                var me = this;
                actualLoadPromise.then(function() {
                    me.loadPromise.resolve();
                });
            };
            
            waitForLoadAssets() {
                return this.loadPromise;
            };
            
            getCellGrid(): SplitTime.level.CellGrid {
                return this._cellGrid;
            };
            
            getLevelTraces(): SplitTime.level.Traces {
                return this._levelTraces;
            };
            
            getBackgroundImage(): HTMLImageElement {
                if(!this.background) {
                    return null;
                }
                return SplitTime.image.get(this.background);
            };
            
            getDebugTraceCanvas() {
                return this._levelTraces.getDebugTraceCanvas();
            };
            
            getRegion(): SplitTime.Region {
                if(!this.region) {
                    console.warn("Level \"" + this.id + "\" is not assigned to a region");
                    this.region = SplitTime.Region.getDefault();
                }
                return this.region;
            };
            
            getPosition(positionId: string): SplitTime.Position {
                if(!this.positions[positionId]) {
                    console.warn("Level \"" + this.id + "\" does not contain the position \"" + positionId + "\"");
                    this.positions[positionId] = new SplitTime.Position(this, 0, 0, 0, SplitTime.Direction.S, "default");
                }
                return this.positions[positionId];
            };
            
            registerEnterFunction(fun) {
                this.registerEvent(ENTER_LEVEL_FUNCTION_ID, fun);
            };
            
            registerExitFunction(fun) {
                this.registerEvent(EXIT_LEVEL_FUNCTION_ID, fun);
            };
            
            registerEvent(eventId, callback) {
                this.events[eventId] = callback;
            };
            
            registerPosition(positionId, position) {
                this.positions[positionId] = position;
            };
            
            runEvent(eventId, param) {
                var that = this;
                var fun = this.events[eventId] || function() {
                    console.warn("Event \"" + eventId + "\" not found for level " + that.id);
                };
                return fun(param);
            };
            
            runEvents(eventIds, param) {
                for(var i = 0; i < eventIds.length; i++) {
                    this.runEvent(eventIds[i], param);
                }
            };
            runEventSet(eventIdSet, param) {
                for(var id in eventIdSet) {
                    this.runEvent(id, param);
                }
            };
            
            notifyFrameUpdate(delta) {
                this.forEachBody(function(body) {
                    body.notifyFrameUpdate(delta);
                });
            };
  
            notifyTimeAdvance(delta) {
                this.forEachBody(function(body) {
                    body.notifyTimeAdvance(delta);
                });
            }

            notifyBodyMoved(body) {
                if(this._cellGrid) {
                    this._cellGrid.resort(body);
                }
            };
            
            forEachBody(callback: (body: SplitTime.Body) => any) {
                for(var i = 0; i < this.bodies.length; i++) {
                    callback(this.bodies[i]);
                }
            };
            
            getBodies(): SplitTime.Body[] {
                return this.bodies;
            };
            
            refetchBodies() {
                // this._bodyOrganizer = new SplitTime.level.BodyOrganizer(this);
                this._cellGrid = new SplitTime.level.CellGrid(this);
                
                for(var iBody = 0; iBody < this.bodies.length; iBody++) {
                    this._cellGrid.addBody(this.bodies[iBody]);
                }
                
                this._addingProps = true;
                //Pull board objects from file
                for(var iProp = 0; iProp < this.fileData.props.length; iProp++) {
                    var prop = this.fileData.props[iProp];
                    var template = prop.template;
                    
                    var obj = SplitTime.body.getTemplateInstance(template);
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
            */
            insertBody(body: SplitTime.Body) {
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
            */
            removeBody(body: SplitTime.Body) {
                if(this._cellGrid) {
                    this._cellGrid.removeBody(body);
                }
                var iBody = this.bodies.indexOf(body);
                if(iBody >= 0) {
                    this.bodies.splice(iBody, 1);
                }
            };
            
            loadForPlay() {
                var that = this;
                return currentLevel.waitForLoadAssets().then(function() {
                    that.refetchBodies();
                    that._levelTraces = new SplitTime.level.Traces(that, that.fileData);
                });
            };
            
            unload() {
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
            
            static get(levelId: string): SplitTime.Level {
                if(!levelMap[levelId]) {
                    levelMap[levelId] = new SplitTime.Level(levelId);
                }
                return levelMap[levelId];
            };
            
            /**
            * STOP!!! This method should ONLY be called by the main game loop.
            */
            static applyTransition() {
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
                var promise = changeRegion ? currentLevel.getRegion().loadForPlay() : SLVD.Promise.as();
                promise.then(function() {
                    SplitTime.process = currentLevel.type;
                    if(currentLevel.events[ENTER_LEVEL_FUNCTION_ID]) {
                        currentLevel.runEvent(ENTER_LEVEL_FUNCTION_ID);
                    }
                    inTransition = false;
                    transitionPromise.resolve();
                });
            };
            
            static transition(level: SplitTime.Level | string): SLVD.Promise {
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
            
            static getCurrent(): SplitTime.Level {
                return currentLevel;
            };
        }
    }