namespace splitTime {
    var nextRef = 10 //reserve first 10

    export class Body {
        template: string | null = null
        id: string = "NOT SET"
        ref: int
        private frameUpdateHandlers: splitTime.RegisterCallbacks
        private timeAdvanceListeners: splitTime.RegisterCallbacks
        private playerInteractHandlers: splitTime.RegisterCallbacks
        mover: splitTime.body.Mover
        speechBox: splitTime.body.SpeechBox

        drawable: splitTime.body.Drawable | null = null
        lightIntensity = 0
        lightRadius = 150
        shadow = false

        private _level: splitTime.Level | null = null
        _x = 0
        _y = 0
        _z = 0
        _time: game_ms = Number.NEGATIVE_INFINITY

        childrenBolted: Body[] = []
        childrenLoose: Body[] = []

        dir = 3

        GRAVITY = -1280
        zVelocity = 0
        height = 32

        //The splitTime.Body's base is the collision area of the splitTime.Body
        baseLength = 16
        //Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
        baseOffX = 0
        baseOffY = 0

        // TODO: remove parameter when moving templates elsewhere
        constructor() {
            this.ref = nextRef++
            this.frameUpdateHandlers = new splitTime.RegisterCallbacks({
                notifyFrameUpdate: null
            })
            this.timeAdvanceListeners = new splitTime.RegisterCallbacks({
                notifyTimeAdvance: null
            })
            this.playerInteractHandlers = new splitTime.RegisterCallbacks({
                onPlayerInteract: null
            })
            this.mover = new splitTime.body.Mover(this)
            // TODO: sort out (throw out) inheritance to make this work right
            this.speechBox = new splitTime.body.SpeechBox(this, 42)
        }
        get x() {
            return this.getX()
        }
        set x(newX) {
            this.setX(newX, true)
        }
        get y() {
            return this.getY()
        }
        set y(newY) {
            this.setY(newY, true)
        }
        get z() {
            return this.getZ()
        }
        set z(newZ) {
            this.setZ(newZ, true)
        }
        get level() {
            return this.getLevel()
        }
        set level(newLevel) {
            this.setLevel(newLevel, true)
        }
        get halfBaseLength() {
            return Math.round(this.baseLength / 2)
        }

        addChild(child: Body, isBolted: boolean) {
            if (isBolted) {
                if (this.childrenBolted.length === 0) {
                    this.childrenBolted = []
                }
                this.childrenBolted.push(child)
            } else {
                if (this.childrenLoose.length === 0) {
                    this.childrenLoose = []
                }
                this.childrenLoose.push(child)
            }
        }
        removeChild(child: Body) {
            var i
            for (i = 0; i < this.childrenBolted.length; i++) {
                if (this.childrenBolted[i] == child) {
                    this.childrenBolted.splice(i, 1)
                    i--
                }
            }
            for (i = 0; i < this.childrenLoose.length; i++) {
                if (this.childrenLoose[i] == child) {
                    this.childrenLoose.splice(i, 1)
                    i--
                }
            }
        }
        getChildren(): Body[] {
            return this.childrenBolted.concat(this.childrenLoose)
        }

        staticTrace: { traceStr: string; type: string }[] = []
        /**
         * @deprecated should be moved to Prop class or something
         */
        addStaticTrace(traceStr: string, type: string) {
            if (this.staticTrace.length === 0) {
                this.staticTrace = []
            }
            this.staticTrace.push({ traceStr: traceStr, type: type })
        }

        _resortInBodyOrganizer() {
            if (this._level) {
                this._level.notifyBodyMoved(this)
            }
        }

        getX() {
            return this._x
        }
        setX(x: number, includeChildren = false) {
            if (includeChildren) {
                var children = this.getChildren()
                for (var i = 0; i < children.length; i++) {
                    var currentChild = children[i]
                    var dx = currentChild.getX() - this._x
                    currentChild.setX(x + dx, true)
                }
            }
            if (x !== this._x) {
                this._x = x
                this._resortInBodyOrganizer()
            }
        }
        getY() {
            return this._y
        }
        setY(y: number, includeChildren = false) {
            if (includeChildren) {
                var children = this.getChildren()
                for (var i = 0; i < children.length; i++) {
                    var currentChild = children[i]
                    var dy = currentChild.getY() - this._y
                    currentChild.setY(y + dy, true)
                }
            }
            if (y !== this._y) {
                this._y = y
                this._resortInBodyOrganizer()
            }
        }
        getZ() {
            return this._z
        }
        setZ(z: number, includeChildren = false) {
            if (includeChildren) {
                var children = this.getChildren()
                for (var i = 0; i < children.length; i++) {
                    var currentChild = children[i]
                    var dLayer = currentChild.getZ() - this._z
                    currentChild.setZ(z + dLayer, true)
                }
            }
            if (z !== this._z) {
                this._z = z
                this._resortInBodyOrganizer()
            }
        }

        getLeft(): number {
            return this.getX() - this.baseLength / 2
        }

        getTopY(): number {
            return this.getY() - this.baseLength / 2
        }

        put(
            level: Level,
            x: number,
            y: number,
            z: number,
            includeChildren = false
        ) {
            this.setLevel(level, includeChildren)
            this.setX(x, includeChildren)
            this.setY(y, includeChildren)
            this.setZ(z, includeChildren)
        }

        putInLocation(location: ILevelLocation, includeChildren = false) {
            this.put(
                location.getLevel(),
                location.getX(),
                location.getY(),
                location.getZ(),
                includeChildren
            )
        }

        putInPosition(position: Position, includeChildren = false) {
            this.put(
                position.getLevel(),
                position.getX(),
                position.getY(),
                position.getZ(),
                includeChildren
            )
            this.dir = position.dir
            if (this.drawable instanceof Sprite) {
                this.drawable.requestStance(
                    position.stance,
                    this.dir,
                    true,
                    true
                )
            }
        }

        setLevel(
            level: splitTime.Level | null,
            includeChildren: boolean = false
        ) {
            if (level === this._level) {
                return
            }

            if (this._level) {
                this._level.removeBody(this)
            }

            this._level = level
            if (this._level) {
                this._level.insertBody(this)
            }

            if (includeChildren) {
                var children = this.getChildren()
                for (var i = 0; i < children.length; i++) {
                    if (includeChildren) {
                        children[i].setLevel(level, includeChildren)
                    } else {
                        this.removeChild(children[i])
                    }
                }
            }
        }
        getLevel(): splitTime.Level {
            if (!this._level) {
                throw new Error("Body is not in a Level")
            }
            return this._level
        }
        /**
         * @deprecated perhaps too much clog
         */
        getRegion(): splitTime.Region {
            return this.getLevel().getRegion()
        }

        notifyFrameUpdate(delta: real_seconds) {
            this.frameUpdateHandlers.run(delta)
            try {
                if (
                    this.drawable &&
                    splitTime.instanceOf.FrameNotified(this.drawable)
                ) {
                    this.drawable.notifyFrameUpdate(delta)
                }
            } catch (e) {
                splitTime.log.error(e)
            }
        }

        notifyTimeAdvance(delta: game_seconds, absoluteTime: game_seconds) {
            const ZILCH = 0.00001
            const cappedDelta = Math.min(delta, absoluteTime - this._time)
            this._time = absoluteTime
            // If we accidentally get into two different levels' time update loops,
            // we don't want to advance more time
            if (cappedDelta < ZILCH) {
                return
            }

            this.timeAdvanceListeners.run(delta)

            var level = this._level
            if (level && level.isLoaded()) {
                if (this.baseLength > ZILCH) {
                    if (Math.abs(this.zVelocity) > ZILCH) {
                        var expectedDZ = this.zVelocity * delta
                        var actualDZ = this.mover.zeldaVerticalBump(expectedDZ)
                        if (Math.abs(actualDZ) <= ZILCH) {
                            this.zVelocity = 0
                        }
                    }
                    // Up the velocity after the move so that others can cancel it out beforehand
                    this.zVelocity += this.GRAVITY * delta
                }
            }

            try {
                if (
                    this.drawable &&
                    splitTime.instanceOf.TimeNotified(this.drawable)
                ) {
                    this.drawable.notifyTimeAdvance(delta)
                }
            } catch (e) {
                splitTime.log.error(e)
            }
        }

        notifyPlayerInteract() {
            this.playerInteractHandlers.run()
        }

        registerTimeAdvanceListener(
            handler: ((delta: game_seconds) => splitTime.CallbackResult) | splitTime.TimeNotified
        ) {
            this.timeAdvanceListeners.register(handler)
        }

        //Function run on ENTER or SPACE
        registerPlayerInteractHandler(handler: () => void) {
            this.playerInteractHandlers.register(handler)
        }
        deregisterPlayerInteractHandler(handler: () => void) {
            this.playerInteractHandlers.remove(handler)
        }

        // Generally equates to pixels per second (game time)
        spd = 2
    }
}
