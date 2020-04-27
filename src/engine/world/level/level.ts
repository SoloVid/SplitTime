namespace splitTime {
    export class Level {
        id: string
        private loader: LevelLoader
        private events: { [id: string]: (triggeringBody: Body) => void }
        private enterFunction: (() => void) | null = null
        private exitFunction: (() => void) | null = null
        private positions: { [id: string]: Position }
        region: Region | null
        bodies: Body[]
        background: string
        _cellGrid: level.CellGrid | null
        weather: WeatherSettings
        _props: any[]
        type: "action" | null = null
        width: int = 0
        height: int = 0
        yWidth: int = 0
        lowestLayerZ: int = 0
        highestLayerZ: int = 0
        _levelTraces: any
        constructor(levelId: string) {
            this.id = levelId
            this.loader = new LevelLoader(this)
            this.events = {}
            this.positions = {}
            this.region = null
            this.bodies = []
            this.background = ""

            // this._bodyOrganizer = new splitTime.Level.BodyOrganizer();
            this._cellGrid = null

            this.weather = new WeatherSettings()

            this._props = []
        }

        load(
            world: World,
            levelData: splitTime.level.FileData
        ): PromiseLike<any> {
            return this.loader.load(world, levelData)
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

        getDebugTraceCanvas(): splitTime.Canvas {
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

        registerEnterFunction(fun: () => void) {
            this.enterFunction = fun
        }

        registerExitFunction(fun: () => void) {
            this.exitFunction = fun
        }

        registerEvent(eventId: string, callback: (triggeringBody: Body) => void) {
            this.events[eventId] = callback
        }

        registerPosition(positionId: string, position: Position) {
            this.positions[positionId] = position
        }

        runEnterFunction() {
            if (this.enterFunction) {
                this.enterFunction()
            }
        }

        runExitFunction() {
            if (this.exitFunction) {
                this.exitFunction()
            }
        }

        private runEvent(eventId: string, triggeringBody: Body) {
            var that = this
            var fun =
                this.events[eventId] ||
                function() {
                    console.warn(
                        'Event "' + eventId + '" not found for level ' + that.id
                    )
                }
            return fun(triggeringBody)
        }

        runEvents(eventIds: string[], triggeringBody: Body) {
            for (var i = 0; i < eventIds.length; i++) {
                this.runEvent(eventIds[i], triggeringBody)
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

        /**
         * @deprecated Used to be related to rendering; not sure interface is still appropriate
         */
        insertBody(body: splitTime.Body) {
            if (this.bodies.indexOf(body) < 0) {
                this.bodies.push(body)
                if (this.loader._addingProps) {
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

        loadForPlay(world: World): Promise<any> {
            return this.loader.loadForPlay(world)
        }

        unload() {
            //TODO: give listeners a chance to clean up

            this.loader.unload()
        }
    }
}
