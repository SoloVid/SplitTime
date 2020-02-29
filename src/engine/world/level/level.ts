namespace splitTime {
    export const ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL"
    export const EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL"

    export class Level {
        id: string
        events: { [id: string]: Function }
        positions: { [id: string]: Position }
        region: Region | null
        bodies: Body[]
        loadPromise: SLVD.Promise
        background: string
        layerFuncData: ImageData[]
        _cellGrid: level.CellGrid | null
        weather: WeatherSettings
        _addingProps: boolean
        _props: any[]
        fileData: level.FileData | null = null
        type: "action" | null = null
        width: int = 0
        height: int = 0
        yWidth: int = 0
        highestLayerZ: int = 0
        _levelTraces: any
        constructor(levelId: string) {
            this.id = levelId
            this.events = {}
            this.positions = {}
            this.region = null
            this.bodies = []
            this.loadPromise = new SLVD.Promise()
            this.background = ""
            this.layerFuncData = []

            // this._bodyOrganizer = new splitTime.Level.BodyOrganizer();
            this._cellGrid = null

            this.weather = new WeatherSettings()

            this._addingProps = false
            this._props = []
        }

        load(
            world: World,
            levelData: splitTime.level.FileData
        ): PromiseLike<any> {
            const levelLoadPromises: PromiseLike<unknown>[] = []

            world.getRegion(levelData.region).addLevel(this)

            this.fileData = levelData
            this.type = levelData.type
            // this.width = levelData.width || 0;
            // this.height = levelData.height || 0;
            // this.yWidth = levelData.yWidth || 0;

            this.highestLayerZ = 0
            if (levelData.layers.length > 0) {
                this.highestLayerZ =
                    levelData.layers[levelData.layers.length - 1].z
            }

            var that = this
            function onLoadImage(backgroundImg: {
                height: number
                width: number
            }) {
                if (backgroundImg.height > that.height) {
                    that.height = backgroundImg.height
                    that.yWidth = that.height + that.highestLayerZ
                }
                if (backgroundImg.width > that.width) {
                    that.width = backgroundImg.width
                }

                that._cellGrid = new level.CellGrid(that)
            }

            this.background = levelData.background
            if (this.background) {
                var loadProm = G.ASSETS.images
                    .load(this.background)
                    .then(onLoadImage)
                levelLoadPromises.push(loadProm)
            }

            //Pull positions from file
            for (var i = 0; i < levelData.positions.length; i++) {
                var posObj = levelData.positions[i]
                var position = new splitTime.Position(
                    this,
                    +posObj.x,
                    +posObj.y,
                    +posObj.z,
                    splitTime.direction.interpret(posObj.dir),
                    posObj.stance
                )

                if (posObj.id) {
                    this.registerPosition(posObj.id, position)
                } else {
                    console.warn("position missing id in level: " + this.id)
                }

                // var actor = ...;
                // var alias = ...;
                //
                // if(actor && alias) {
                //     splitTime.Actor[actor].registerPosition(alias, position);
                // }
            }

            for (var iLayer = 0; iLayer < levelData.layers.length; iLayer++) {
                var layerTraces = levelData.layers[iLayer].traces
                for (
                    var iLayerTrace = 0;
                    iLayerTrace < layerTraces.length;
                    iLayerTrace++
                ) {
                    var rawTrace = layerTraces[iLayerTrace]
                    var type = rawTrace.type
                    switch (type) {
                        case splitTime.Trace.Type.TRANSPORT:
                            var trace = splitTime.Trace.fromRaw(rawTrace, world)
                            const level = trace.level
                            if (!level) {
                                throw new Error(
                                    "Transport trace is missing level"
                                )
                            }
                            var transportTraceId = trace.getLocationId()
                            this.registerEvent(
                                transportTraceId,
                                (function(trace, level) {
                                    return (body: splitTime.Body) => {
                                        body.put(
                                            level,
                                            body.x + trace.offsetX,
                                            body.y + trace.offsetY,
                                            body.z + trace.offsetZ
                                        )
                                    }
                                })(trace, level)
                            )
                    }
                }
            }

            const aggregatePromise = Promise.all(levelLoadPromises)
            this.setLoadPromise(aggregatePromise)

            return aggregatePromise
        }

        setLoadPromise(actualLoadPromise: Promise<any>) {
            var me = this
            actualLoadPromise.then(function() {
                me.loadPromise.resolve()
            })
        }

        waitForLoadAssets(): PromiseLike<any> {
            return this.loadPromise
        }

        getCellGrid(): splitTime.level.CellGrid {
            if (!this._cellGrid) {
                throw new Error("CellGrid unavailable")
            }
            return this._cellGrid
        }

        getLevelTraces(): splitTime.level.Traces {
            return this._levelTraces
        }

        getBackgroundImage(): string {
            if (!this.background) {
                throw new Error(
                    "Background image for level " + this.id + " is not set"
                )
            }
            return this.background
        }

        getDebugTraceCanvas() {
            return this._levelTraces.getDebugTraceCanvas()
        }

        getRegion(): Region {
            if (!this.region) {
                throw new Error(
                    'Level "' + this.id + '" is not assigned to a region'
                )
            }
            return this.region
        }

        getPosition(positionId: string): splitTime.Position {
            if (!this.positions[positionId]) {
                throw new Error(
                    'Level "' +
                        this.id +
                        '" does not contain the position "' +
                        positionId +
                        '"'
                )
            }
            return this.positions[positionId]
        }

        registerEnterFunction(fun: Function) {
            this.registerEvent(ENTER_LEVEL_FUNCTION_ID, fun)
        }

        registerExitFunction(fun: Function) {
            this.registerEvent(EXIT_LEVEL_FUNCTION_ID, fun)
        }

        registerEvent(eventId: string, callback: Function) {
            this.events[eventId] = callback
        }

        registerPosition(positionId: string, position: Position) {
            this.positions[positionId] = position
        }

        runEvent(eventId: string, param?: any) {
            var that = this
            var fun =
                this.events[eventId] ||
                function() {
                    console.warn(
                        'Event "' + eventId + '" not found for level ' + that.id
                    )
                }
            return fun(param)
        }

        runEvents(eventIds: string[], param: any) {
            for (var i = 0; i < eventIds.length; i++) {
                this.runEvent(eventIds[i], param)
            }
        }
        runEventSet(eventIdSet: { [id: string]: any }, param: any) {
            for (var id in eventIdSet) {
                this.runEvent(id, param)
            }
        }

        notifyFrameUpdate(delta: real_seconds) {
            this.forEachBody(function(body) {
                body.notifyFrameUpdate(delta)
            })
        }

        notifyTimeAdvance(delta: game_seconds) {
            this.forEachBody(function(body) {
                body.notifyTimeAdvance(delta)
            })
        }

        notifyBodyMoved(body: Body) {
            if (this._cellGrid) {
                this._cellGrid.resort(body)
            }
        }

        forEachBody(callback: (body: splitTime.Body) => any) {
            for (var i = 0; i < this.bodies.length; i++) {
                callback(this.bodies[i])
            }
        }

        getBodies(): splitTime.Body[] {
            return this.bodies
        }

        refetchBodies() {
            if (this.fileData === null) {
                throw new Error("this.fileData is null")
            }

            // this._bodyOrganizer = new splitTime.level.BodyOrganizer(this);
            this._cellGrid = new splitTime.level.CellGrid(this)

            for (var iBody = 0; iBody < this.bodies.length; iBody++) {
                this._cellGrid.addBody(this.bodies[iBody])
            }

            this._addingProps = true
            //Pull board objects from file
            for (var iProp = 0; iProp < this.fileData.props.length; iProp++) {
                var prop = this.fileData.props[iProp]
                var template = prop.template

                var obj = G.BODY_TEMPLATES.getInstance(template)
                if (obj) {
                    obj.id = prop.id
                    obj.put(this, +prop.x, +prop.y, +prop.z, true)
                    obj.dir =
                        typeof prop.dir === "string"
                            ? splitTime.direction.fromString(prop.dir)
                            : +prop.dir
                    if (obj.drawable instanceof Sprite) {
                        obj.drawable.requestStance(
                            prop.stance,
                            obj.dir,
                            true,
                            true
                        )
                    }
                    if (
                        obj.drawable &&
                        (prop.playerOcclusionFadeFactor ||
                            prop.playerOcclusionFadeFactor === "0")
                    ) {
                        obj.drawable.playerOcclusionFadeFactor = +prop.playerOcclusionFadeFactor
                    }
                } else {
                    splitTime.Logger.error(
                        'Template "' +
                            template +
                            '" not found for instantiating prop'
                    )
                }
            }
            this._addingProps = false
        }

        /**
         * @deprecated Used to be related to rendering; not sure interface is still appropriate
         */
        insertBody(body: splitTime.Body) {
            if (this.bodies.indexOf(body) < 0) {
                this.bodies.push(body)
                if (this._addingProps) {
                    this._props.push(body)
                }
            }
            if (this._cellGrid) {
                this._cellGrid.addBody(body)
            }
        }

        /**
         * @deprecated Used to be related to rendering; not sure interface is still appropriate
         */
        removeBody(body: splitTime.Body) {
            if (this._cellGrid) {
                this._cellGrid.removeBody(body)
            }
            var iBody = this.bodies.indexOf(body)
            if (iBody >= 0) {
                this.bodies.splice(iBody, 1)
            }
        }

        async loadForPlay(world: World): Promise<any> {
            await this.waitForLoadAssets()

            this.refetchBodies()
            if (this.fileData === null) {
                throw new Error("this.fileData is null")
            }
            this._levelTraces = new splitTime.level.Traces(
                this,
                this.fileData,
                world
            )
        }

        unload() {
            //TODO: give listeners a chance to clean up

            //Clear out all functional maps and other high-memory resources
            this._levelTraces = null
            this._cellGrid = null

            for (var i = 0; i < this._props.length; i++) {
                // We don't just remove from this level because we don't want props to leak out into other levels.
                var l = this._props[i].getLevel()
                l.removeBody(this._props[i])
            }
            this._props = []
        }
    }
}
