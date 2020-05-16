namespace splitTime {
    type EventCallback = ((triggeringBody: Body) => void) | ((triggeringBody: Body, eventId: string) => void)

    export class Level {
        id: string
        private loader: LevelLoader
        private loaded: boolean = false
        private events: { [id: string]: EventCallback } = {}
        private enterFunction: (() => void) | null = null
        private exitFunction: (() => void) | null = null
        private positions: { [id: string]: Position } = {}
        region: Region | null = null
        bodies: Body[] = []
        background: string = ""
        backgroundOffsetX: int = 0
        backgroundOffsetY: int = 0
        _cellGrid: level.CellGrid | null = null
        weather: WeatherSettings = new WeatherSettings()
        _props: Body[] = []
        type: "action" | null = null
        width: int = 0
        height: int = 0
        yWidth: int = 0
        lowestLayerZ: int = 0
        highestLayerZ: int = 0
        _levelTraces: level.Traces | null = null
        constructor(levelId: string) {
            this.id = levelId
            this.loader = new LevelLoader(this)
        }

        /**
         * A level can be referenced but not have a level file.
         * This method is to help protect against that.
         */
        private ensureHasFile(): void | never {
            if (!this.loader.hasData()) {
                throw new Error("Not level file found associated with " + this.id)
            }
        }

        private ensureLoaded(): void | never {
            this.ensureHasFile()
            if (!this.isLoaded()) {
                throw new Error("Level " + this.id + " is not currently loaded")
            }
        }

        load(
            world: World,
            levelData: splitTime.level.FileData
        ): PromiseLike<void> {
            return this.loader.load(world, levelData)
        }

        getCellGrid(): splitTime.level.CellGrid {
            this.ensureLoaded()
            if (!this._cellGrid) {
                throw new Error("CellGrid unavailable")
            }
            return this._cellGrid
        }

        getLevelTraces(): splitTime.level.Traces {
            this.ensureLoaded()
            if (!this._levelTraces) {
                throw new Error("Level traces unavailable")
            }
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
            return this.getLevelTraces().getDebugTraceCanvas()
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
            this.ensureHasFile()
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

        registerEvent(eventId: string, callback: EventCallback) {
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
            return fun(triggeringBody, eventId)
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

        notifyTimeAdvance(delta: game_seconds, absoluteTime: game_seconds) {
            this.forEachBody(function(body) {
                body.notifyTimeAdvance(delta, absoluteTime)
            })
        }

        notifyBodyMoved(body: Body) {
            if (this._cellGrid) {
                this._cellGrid.resort(body)
            }
        }

        forEachBody(callback: (body: splitTime.Body) => void) {
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

        loadForPlay(world: World): PromiseLike<void> {
            return this.loader.loadForPlay(world).then(() => {
                this.loaded = true
            })
        }

        unload(): void {
            //TODO: give listeners a chance to clean up

            this.loader.unload()
            this.loaded = false
        }

        isLoaded(): boolean {
            return this.loaded
        }
    }
}
