namespace splitTime {
    export class LevelLoader {
        fileData: level.FileData | null = null
        _addingProps: boolean
        loadPromise: splitTime.Pledge

        constructor(private readonly level: Level) {
            this._addingProps = false
            this.loadPromise = new splitTime.Pledge()
        }

        load(
            world: World,
            levelData: splitTime.level.FileData
        ): PromiseLike<any> {
            const levelLoadPromises: PromiseLike<unknown>[] = []

            world.getRegion(levelData.region).addLevel(this.level)

            this.fileData = levelData
            this.level.type = levelData.type
            // this.width = levelData.width || 0;
            // this.height = levelData.height || 0;
            // this.yWidth = levelData.yWidth || 0;

            this.level.lowestLayerZ = 0
            this.level.highestLayerZ = 0
            if (levelData.layers.length > 0) {
                this.level.lowestLayerZ =
                    levelData.layers[0].z
                this.level.highestLayerZ =
                    levelData.layers[levelData.layers.length - 1].z
            }

            var that = this
            function onLoadImage(backgroundImg: {
                height: number
                width: number
            }) {
                if (backgroundImg.height > that.level.height) {
                    that.level.height = backgroundImg.height
                    that.level.yWidth = that.level.height + that.level.highestLayerZ
                }
                if (backgroundImg.width > that.level.width) {
                    that.level.width = backgroundImg.width
                }

                that.level._cellGrid = new level.CellGrid(that.level)
            }

            this.level.background = levelData.background
            if (this.level.background) {
                var loadProm = G.ASSETS.images
                    .load(this.level.background)
                    .then(onLoadImage)
                levelLoadPromises.push(loadProm)
            }

            //Pull positions from file
            for (var i = 0; i < levelData.positions.length; i++) {
                var posObj = levelData.positions[i]
                var position = new splitTime.Position(
                    this.level,
                    +posObj.x,
                    +posObj.y,
                    +posObj.z,
                    splitTime.direction.interpret(posObj.dir),
                    posObj.stance
                )

                if (posObj.id) {
                    this.level.registerPosition(posObj.id, position)
                } else {
                    console.warn("position missing id in level: " + this.level.id)
                }
            }

            for (var iLayer = 0; iLayer < levelData.layers.length; iLayer++) {
                var layerTraces = levelData.layers[iLayer].traces
                const z = levelData.layers[iLayer].z
                for (
                    var iLayerTrace = 0;
                    iLayerTrace < layerTraces.length;
                    iLayerTrace++
                ) {
                    var rawTrace = layerTraces[iLayerTrace]
                    var type = rawTrace.type
                    switch (type) {
                        case splitTime.Trace.Type.TRANSPORT:
                            var trace = splitTime.Trace.fromRaw(rawTrace, z, world)
                            const level = trace.level
                            if (!level) {
                                throw new Error(
                                    "Transport trace is missing level"
                                )
                            }
                            var transportTraceId = trace.getLocationId()
                            this.level.registerEvent(
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

        refetchBodies() {
            if (this.fileData === null) {
                throw new Error("this.fileData is null")
            }

            // this._bodyOrganizer = new splitTime.level.BodyOrganizer(this);
            this.level._cellGrid = new splitTime.level.CellGrid(this.level)

            for (var iBody = 0; iBody < this.level.bodies.length; iBody++) {
                this.level._cellGrid.addBody(this.level.bodies[iBody])
            }

            this._addingProps = true
            //Pull board objects from file
            for (var iProp = 0; iProp < this.fileData.props.length; iProp++) {
                var prop = this.fileData.props[iProp]
                var template = prop.template

                var obj = G.BODY_TEMPLATES.getInstance(template)
                if (obj) {
                    obj.id = prop.id
                    obj.put(this.level, +prop.x, +prop.y, +prop.z, true)
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
                    splitTime.log.error(
                        'Template "' +
                            template +
                            '" not found for instantiating prop'
                    )
                }
            }
            this._addingProps = false
        }

        async loadForPlay(world: World): Promise<any> {
            await this.loadPromise

            this.refetchBodies()
            if (this.fileData === null) {
                throw new Error("this.fileData is null")
            }
            this.level._levelTraces = new splitTime.level.Traces(
                this.level,
                this.fileData,
                world
            )
        }

        unload() {
            //Clear out all functional maps and other high-memory resources
            this.level._levelTraces = null
            this.level._cellGrid = null

            for (var i = 0; i < this.level._props.length; i++) {
                // We don't just remove from this level because we don't want props to leak out into other levels.
                var l = this.level._props[i].getLevel()
                l.removeBody(this.level._props[i])
            }
            this.level._props = []
        }
    }
}
