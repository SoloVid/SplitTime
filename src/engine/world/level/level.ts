namespace splitTime {
    export const ENTER_LEVEL_FUNCTION_ID = "__ENTER_LEVEL"
    export const EXIT_LEVEL_FUNCTION_ID = "__EXIT_LEVEL"

    export class Level {
        id: string
        private loader: LevelLoader
        events: { [id: string]: Function }
        positions: { [id: string]: Position }
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
