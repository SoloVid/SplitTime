namespace splitTime {
    export class LevelLoader {
        private fileData: level.FileData | null = null
        _addingProps: boolean
        private loadPromise: splitTime.Pledge

        constructor(
            private readonly level: Level,
            private readonly levelData: splitTime.level.FileData
        ) {
            this._addingProps = false
            this.loadPromise = new splitTime.Pledge()
        }

        hasData(): boolean {
            return this.fileData !== null
        }

        readFileData(
            world: World
        ): void {
            world.getRegion(this.levelData.region).addLevel(this.level)

            this.fileData = this.levelData
            this.level.type = this.levelData.type
            this.level.width = this.levelData.width || 0;
            this.level.height = this.levelData.height || 0;

            this.level.lowestLayerZ = 0
            this.level.highestLayerZ = 0
            for (const trace of this.levelData.traces) {
                if (trace.z < this.level.lowestLayerZ) {
                    this.level.lowestLayerZ = +trace.z
                }
                if (trace.z > this.level.highestLayerZ) {
                    this.level.highestLayerZ = +trace.z
                }
            }

            this.level.yWidth = this.level.height + this.level.highestLayerZ
            this.level._cellGrid = new level.CellGrid(this.level)

            this.level.background = this.levelData.background
            this.level.backgroundOffsetX = this.levelData.backgroundOffsetX
            this.level.backgroundOffsetY = this.levelData.backgroundOffsetY

            //Pull positions from file
            for (var i = 0; i < this.levelData.positions.length; i++) {
                var posObj = this.levelData.positions[i]
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
                    log.warn("position missing id in level: " + this.level.id)
                }
            }

            for (const rawTrace of this.levelData.traces) {
                const traceSpec = trace.TraceSpec.fromRaw(rawTrace)
                const t = new Trace(traceSpec)
                t.load(this.level, world)
                switch (traceSpec.type) {
                    case trace.Type.TRANSPORT:
                        const pointerOffset = t.getPointerOffset()
                        var transportTraceId = traceSpec.getLocationId()
                        this.level.registerEvent(
                            transportTraceId,
                            ((trace, level) => {
                                return (body: splitTime.Body) => {
                                    splitTime.body.smoothPut(body, {
                                        level: pointerOffset.level,
                                        x: body.x + pointerOffset.offsetX,
                                        y: body.y + pointerOffset.offsetY,
                                        z: body.z + pointerOffset.offsetZ
                                    })
                                }
                            })(t, level)
                        )
                        break;
                    case trace.Type.PATH:
                        this.connectPositionsFromPath(t.spec)
                        break;
                }
            }
        }

        connectPositionsFromPath(traceSpec: trace.TraceSpec) {
            const points = traceSpec.vertices
            for (let i = 0; i < points.length; i++) {
                const point1 = points[i]
                if (typeof point1 === "string") {
                    const position1 = this.level.getPosition(point1)
                    for (let j = i + 1; j < points.length; j++) {
                        const point2 = points[j]
                        if (typeof point2 === "string") {
                            const position2 = this.level.getPosition(point2)
                            const midPoints = trace.extractCoordinates(points.slice(i + 1, j))
                            position1.registerPath(position2, midPoints.slice())
                            position2.registerPath(position1, midPoints.slice().reverse())
                            break;
                        }
                    }
                }
            }
        }

        refetchBodies() {
            assert(this.fileData !== null, "Level must have file data")

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
                    // TODO: re-evaluate
                    for (const drawable of obj.drawables) {
                        if (drawable instanceof Sprite) {
                            drawable.requestStance(
                                prop.stance,
                                obj.dir,
                                true,
                                true
                            )
                        }
                        if (
                            (prop.playerOcclusionFadeFactor ||
                                prop.playerOcclusionFadeFactor === 0)
                        ) {
                            drawable.playerOcclusionFadeFactor = +prop.playerOcclusionFadeFactor
                        }
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

        async loadAssets(world: World): Promise<void> {
            await G.ASSETS.images.load(this.level.background)
        }

        async loadForPlay(world: World): Promise<void> {
            await this.loadAssets(world)

            this.refetchBodies()
            assert(this.fileData !== null, "Level must have file data to be loaded")
            const traceSpecs = this.fileData.traces.map(t => trace.TraceSpec.fromRaw(t))
            const traces = traceSpecs.map(spec => {
                const trace = new Trace(spec)
                trace.load(this.level, world)
                return trace
            })
            this.level._levelTraces = new splitTime.level.Traces(
                traces,
                this.level.width,
                this.level.yWidth
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
