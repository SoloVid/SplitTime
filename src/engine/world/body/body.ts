namespace splitTime {
    var nextRef = 10 //reserve first 10

    export class Body {
        // FTODO: figure out if should remove this
        template: string | null = null
        id: string = "NOT SET"
        ref: int
        private timeAdvanceListeners: splitTime.RegisterCallbacks
        private readonly customEvents: { [id: string]: splitTime.RegisterCallbacks } = {}
        mover: splitTime.body.Mover

        // FTODO: I don't think this belongs here
        /** @deprecated doesn't belong here */
        fadeEnteringLevelPromise: Pledge | null = null

        drawables: splitTime.body.Drawable[] = []
        shadow = false

        private _level: splitTime.Level | null = null
        levelLocked: boolean = false
        // Coordinates represent center of base: x is midpoint, y is midpoint, z is bottom
        private _x = 0
        private _y = 0
        private _z = 0
        private _time: game_ms = Number.NEGATIVE_INFINITY

        childrenBolted: Body[] = []
        childrenLoose: Body[] = []

        // FTODO: get rid of this from here
        /**
         * @deprecated direction doesn't mean anything to Body at this point
         */
        dir: direction_t = 3

        GRAVITY = -1280
        // For gravity etc., auto-applied z-axis motion in pixels per second
        zVelocity = 0

        // Collision volume dimensions
        /** x-axis base length */
        private _width = 16
        /** y-axis base length */
        private _depth = 16
        /** z-axis length */
        private _height = 32

        // TODO: should this be some kind of sliding scale, like friction or mass?
        pushable: boolean = false
        readonly collisionMask: CollisionMask = {
            membership: 1,
            search: 1
        }

        // TODO: remove parameter when moving templates elsewhere
        constructor() {
            this.ref = nextRef++
            this.timeAdvanceListeners = new splitTime.RegisterCallbacks({
                notifyTimeAdvance: null
            })
            this.mover = new splitTime.body.Mover(this)
        }
        get width(): int {
            return this._width
        }
        set width(val: int) {
            if (!Number.isInteger(val)) {
                throw new Error("Width must be an integer")
            }
            if (val % 2 !== 0) {
                throw new Error("Width must be a multiple of 2")
            }
            this._width = val
            this._resortInBodyOrganizer()
        }
        get depth(): int {
            return this._depth
        }
        set depth(val: int) {
            if (!Number.isInteger(val)) {
                throw new Error("Depth must be an integer")
            }
            if (val % 2 !== 0) {
                throw new Error("Depth must be a multiple of 2")
            }
            this._depth = val
            this._resortInBodyOrganizer()
        }
        get height(): int {
            return this._height
        }
        set height(val: int) {
            if (!Number.isInteger(val)) {
                throw new Error("Height must be an integer")
            }
            this._height = val
            this._resortInBodyOrganizer()
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

        private _resortInBodyOrganizer() {
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
            return this.x - this.width / 2
        }

        getTopY(): number {
            return this.y - this.depth / 2
        }

        /**
         * Put this body in the specified level at the specified coordinates.
         *
         * @param level - the level to put the body into
         * @param x - the x coordinate of the target location
         * @param y - the y coordinate of the target location
         * @param z - the z coordinate of the target location
         * @param includeChildren - whether or not to put the children of this body in the specified location as well
         */  
        put(
            level: Level | null,
            x: number,
            y: number,
            z: number,
            includeChildren = false
        ): void {
            //Put the body in the specified level / coordinates
            this.setLevel(level, includeChildren)
            this.setX(x, includeChildren)
            this.setY(y, includeChildren)
            this.setZ(z, includeChildren)
        }

        putInLocation(location: ILevelLocation2, includeChildren = false): void {
            return this.put(
                location.level,
                location.x,
                location.y,
                location.z,
                includeChildren
            )
        }

        clearLevel(): void {
            this.setLevel(null)
        }

        private setLevel(
            level: splitTime.Level | null,
            includeChildren: boolean = false
        ): void {
            assert(!this.levelLocked, "Cannot set level when levelLocked === true")
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
                if (this.width > ZILCH && this.depth > ZILCH && this.height > ZILCH) {
                    if (Math.abs(this.zVelocity) > ZILCH) {
                        var expectedDZ = this.zVelocity * delta
                        var actualDZ = this.mover.zeldaVerticalBump(expectedDZ)
                        if (Math.abs(actualDZ) < Math.abs(expectedDZ)) {
                            this.zVelocity = 0
                        }
                    }
                    // Up the velocity after the move so that others can cancel it out beforehand
                    this.zVelocity += this.GRAVITY * delta
                }
            }

            for (const drawable of this.drawables) {
                // TODO: either remove check or remove Drawable "extends TimeNotified"
                if (splitTime.instanceOf.TimeNotified(drawable)) {
                    drawable.notifyTimeAdvance(delta)
                }
            }
        }

        registerTimeAdvanceListener(
            handler: ((delta: game_seconds) => splitTime.CallbackResult) | splitTime.TimeNotified
        ) {
            this.timeAdvanceListeners.register(handler)
        }

        registerEventListener(id: string, handler: (data: unknown) => CallbackResult): void {
            this.getCustomEventCallbacks(id).register(handler)
        }
        removeEventListener(id: string, handler: (data: unknown) => CallbackResult): void {
            this.getCustomEventCallbacks(id).remove(handler)
        }
        triggerEvent(id: string, data: unknown): void {
            if (id in this.customEvents) {
                this.getCustomEventCallbacks(id).run(data)
            }
        }
        hasEventListener(id: string): boolean {
            return this.getCustomEventCallbacks(id).length > 0
        }

        private getCustomEventCallbacks(id: string): RegisterCallbacks {
            if (!(id in this.customEvents)) {
                this.customEvents[id] = new RegisterCallbacks()
            }
            return this.customEvents[id]
        }
    }
}
