namespace SplitTime {
    var ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL";
    var EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL";
    
    var levelMap: { [id: string]: Level } = {};
    var currentLevel: SplitTime.Level | null = null;
    
    var transitionPromise: SLVD.Promise | null = null;
    
    var nextLevel: SplitTime.Level | null = null;
    
    export class Level {
        id: string;
        events: { [id: string]: Function };
        positions: { [id: string]: Position };
        region: Region | null;
        bodies: Body[];
        loadPromise: SLVD.Promise;
        background: string;
        layerFuncData: ImageData[];
        _cellGrid: level.CellGrid | null;
        weatherRenderer: WeatherRenderer;
        _addingProps: boolean;
        _props: any[];
        fileData: level.FileData | null = null;
        type: "action" | null = null;
        width: int = 0;
        height: int = 0;
        yWidth: int = 0;
        highestLayerZ: int = 0;
        _levelTraces: any;
        constructor(levelId: string) {
            this.id = levelId;
            this.events = {};
            this.positions = {};
            this.region = null;
            this.bodies = [];
            this.loadPromise = new SLVD.Promise();
            this.background = "";
            this.layerFuncData = [];
            
            // this._bodyOrganizer = new SplitTime.Level.BodyOrganizer();
            this._cellGrid = null;
            
            this.weatherRenderer = new SplitTime.WeatherRenderer();
            
            this._addingProps = false;
            this._props = [];
        };
        
        static load(levelData: level.FileData) {
            var levelName = levelData.fileName.replace(/\.json$/, "");
            var level = SplitTime.Level.get(levelName);
            return level.load(levelData);
        };
        
        load(levelData: SplitTime.level.FileData): PromiseLike<any> {
            const levelLoadPromises: PromiseLike<unknown>[] = [];
            
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
            function onLoadImage(backgroundImg: { height: number; width: number; }) {
                if(backgroundImg.height > that.height) {
                    that.height = backgroundImg.height;
                    that.yWidth = that.height + that.highestLayerZ;
                }
                if(backgroundImg.width > that.width) {
                    that.width = backgroundImg.width;
                }
                
                that._cellGrid = new level.CellGrid(that);
            }
            
            this.background = levelData.background;
            if(this.background) {
                var loadProm = SplitTime.image.load(this.background).then(onLoadImage);
                levelLoadPromises.push(loadProm);
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
                                const level = trace.level;
                                if(!level) {
                                    throw new Error("Transport trace is missing level");
                                }
                                var transportTraceId = trace.getLocationId();
                                this.registerEvent(transportTraceId, (function(trace, level) {
                                    return (body: SplitTime.Body) => {
                                        body.put(level, body.x + trace.offsetX, body.y + trace.offsetY, body.z + trace.offsetZ);
                                    };
                                } (trace, level)));
                        }
                    }
                }

                const aggregatePromise = Promise.all(levelLoadPromises);
                this.setLoadPromise(aggregatePromise);
                
                return aggregatePromise;
            };
            
            setLoadPromise(actualLoadPromise: Promise<any>) {
                var me = this;
                actualLoadPromise.then(function() {
                    me.loadPromise.resolve();
                });
            };
            
            waitForLoadAssets(): PromiseLike<any> {
                return this.loadPromise;
            };
            
            getCellGrid(): SplitTime.level.CellGrid {
                if(!this._cellGrid) {
                    throw new Error("CellGrid unavailable");
                }
                return this._cellGrid;
            };
            
            getLevelTraces(): SplitTime.level.Traces {
                return this._levelTraces;
            };
            
            getBackgroundImage(): HTMLImageElement {
                if(!this.background) {
                    throw new Error("Background image for level " + this.id + " is not set");
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
            
            registerEnterFunction(fun: Function) {
                this.registerEvent(ENTER_LEVEL_FUNCTION_ID, fun);
            };
            
            registerExitFunction(fun: Function) {
                this.registerEvent(EXIT_LEVEL_FUNCTION_ID, fun);
            };
            
            registerEvent(eventId: string, callback: Function) {
                this.events[eventId] = callback;
            };
            
            registerPosition(positionId: string, position: Position) {
                this.positions[positionId] = position;
            };
            
            runEvent(eventId: string, param?: any) {
                var that = this;
                var fun = this.events[eventId] || function() {
                    console.warn("Event \"" + eventId + "\" not found for level " + that.id);
                };
                return fun(param);
            };
            
            runEvents(eventIds: string[], param: any) {
                for(var i = 0; i < eventIds.length; i++) {
                    this.runEvent(eventIds[i], param);
                }
            };
            runEventSet(eventIdSet: { [id: string]: any }, param: any) {
                for(var id in eventIdSet) {
                    this.runEvent(id, param);
                }
            };
            
            notifyFrameUpdate(delta: number) {
                this.forEachBody(function(body) {
                    body.notifyFrameUpdate(delta);
                });
            };
  
            notifyTimeAdvance(delta: number) {
                this.forEachBody(function(body) {
                    body.notifyTimeAdvance(delta);
                });
            }

            notifyBodyMoved(body: Body) {
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
                if(this.fileData === null) {
                    throw new Error("this.fileData is null");
                }

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
                        obj.dir = typeof prop.dir === "string" ? SplitTime.Direction.fromString(prop.dir) : +prop.dir;
                        if(obj.drawable instanceof Sprite) {
                            obj.drawable.requestStance(prop.stance, obj.dir, true, true);
                        }
                        if(obj.drawable && (prop.playerOcclusionFadeFactor || prop.playerOcclusionFadeFactor === "0")) {
                            obj.drawable.playerOcclusionFadeFactor = +prop.playerOcclusionFadeFactor;
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
            
            async loadForPlay(): Promise<any> {
                if(currentLevel === null) {
                    throw new Error("currentLevel is null");
                }

                await currentLevel.waitForLoadAssets();

                this.refetchBodies();
                if(this.fileData === null) {
                    throw new Error("this.fileData is null");
                }
                this._levelTraces = new SplitTime.level.Traces(this, this.fileData);
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
            static async applyTransition() {
                if(!transitionPromise) {
                    return;
                }

                if(nextLevel === null) {
                    throw new Error("nextLevel is null when applyTransition is called!?!");
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
                
                const enteringLevel = currentLevel;
                SplitTime.process = "loading";
                if(changeRegion) {
                    await currentLevel.getRegion().loadForPlay();
                } else {
                    await Promise.resolve();
                }
                SplitTime.process = enteringLevel.type as string;
                if(enteringLevel.events[ENTER_LEVEL_FUNCTION_ID]) {
                    enteringLevel.runEvent(ENTER_LEVEL_FUNCTION_ID);
                }
                transitionPromise.resolve();
            };
            
            static async transition(level: SplitTime.Level | string): Promise<any> {
                if(typeof level === "string") {
                    level = SplitTime.Level.get(level);
                }
                
                if(transitionPromise) {
                    throw new Error("Level transition is already in progress. Cannot transition to " + level.id);
                }
                
                if(level === currentLevel) {
                    return SLVD.Promise.as();
                }
                
                nextLevel = level;
                transitionPromise = new SLVD.Promise();
                await transitionPromise;
            };
            
            static getCurrent(): SplitTime.Level {
                if(!currentLevel) {
                    throw new Error("currentLevel is not set");
                }
                return currentLevel;
            };
        }
    }