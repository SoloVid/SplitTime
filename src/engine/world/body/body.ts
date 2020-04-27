namespace splitTime {
    var nextRef = 10 //reserve first 10

    export class Body {
        template: string | null = null
        id: string = "NOT SET"
        ref: int
        private frameUpdateHandlers: SLVD.RegisterCallbacks
        private timeAdvanceListeners: SLVD.RegisterCallbacks
        private playerInteractHandlers: SLVD.RegisterCallbacks
        mover: splitTime.body.Mover
        speechBox: splitTime.body.SpeechBox

        inRegionTransition: boolean
        transitionLevel: Level | null
        transitionX: number
        transitionY: number
        transitionZ: number
        transitionIncludeChildren: boolean
        
        // TODO: remove parameter when moving templates elsewhere
        constructor() {
            this.ref = nextRef++
            this.frameUpdateHandlers = new SLVD.RegisterCallbacks({
                notifyFrameUpdate: null
            })
            this.timeAdvanceListeners = new SLVD.RegisterCallbacks({
                notifyTimeAdvance: null
            })
            this.playerInteractHandlers = new SLVD.RegisterCallbacks({
                onPlayerInteract: null
            })
            this.mover = new splitTime.body.Mover(this)
            // TODO: sort out (throw out) inheritance to make this work right
            this.speechBox = new splitTime.body.SpeechBox(this, 42)

            //Initialize variables used for region transitions
            this.inRegionTransition = false
            this.transitionLevel = null
            this.transitionX = -1
            this.transitionY = -1
            this.transitionZ = -1
            this.transitionIncludeChildren = false
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

        drawable: splitTime.body.Drawable | null = null
        lightIntensity = 0
        lightRadius = 150
        shadow = false

        childrenBolted: Body[] = []
        childrenLoose: Body[] = []
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

        //The splitTime.Body's base is the collision area of the splitTime.Body
        baseLength = 16
        //Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
        baseOffX = 0
        baseOffY = 0

        _resortInBodyOrganizer() {
            if (this._level) {
                this._level.notifyBodyMoved(this)
            }
        }

        private _level: splitTime.Level | null = null
        _x = 0
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
        _y = 0
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
        _z = 0
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
        GRAVITY = -1280
        zVelocity = 0
        height = 32

        dir = 3

        getLeft(): number {
            return this.getX() - this.baseLength / 2
        }

        getTopY(): number {
            return this.getY() - this.baseLength / 2
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
        ) {
            this.putWithTransition(
                level,
                x,
                y,
                z,
                includeChildren,
                false
            )
        }

        /**
         * 
         * When the active player is transitioning to a new region and the transition
         * animation is complete, this function puts the body in the new location.
         */
        finishRegionTransition() {
            this.inRegionTransition = false
            
            // Use the arguments that we saved from the initial call to put()
            this.putWithTransition(
                this.transitionLevel,
                this.transitionX,
                this.transitionY,
                this.transitionZ,
                this.transitionIncludeChildren,
                true
            )
        }

        /**
         * Used by put() and finishRegionTransition() to put a body in the specified location 
         * (or save the location for later if a region transition is triggered).
         * 
         * @param @param level - the level to put the body into
         * @param x - the x coordinate of the target location
         * @param y - the y coordinate of the target location
         * @param z - the z coordinate of the target location
         * @param includeChildren - whether or not to put the children of this body in the specified location as well 
         * @param finishTransition - true if a transition animation has just finished
         */
        private putWithTransition(
            level: Level | null,
            x: number,
            y: number,
            z: number,
            includeChildren = false,
            finishTransition = false
        ){
            //If we are switching regions, wait for the world renderer to do the transition animation
            if(
                !finishTransition &&
                this._level !== null &&
                level !== null &&
                this._level?.getRegion() !== level.getRegion()
            ) {
                this.inRegionTransition = true

                //Don't put the body in the next level yet, but save the location
                //information to be used once the transition animation is finished.
                this.transitionLevel = level
                this.transitionX = x
                this.transitionY = y
                this.transitionZ = z
                this.transitionIncludeChildren = includeChildren
            } else {
                //Put the body in the specified level / coordinates
                this.setLevel(level, includeChildren)
                this.setX(x, includeChildren)
                this.setY(y, includeChildren)
                this.setZ(z, includeChildren)
            }
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
                splitTime.Logger.error(e)
            }
        }

        notifyTimeAdvance(delta: game_seconds) {
            this.timeAdvanceListeners.run(delta)

            var level = this._level
            if (level) {
                var ZILCH = 0.00001
                if (this.baseLength > ZILCH) {
                    this.zVelocity += this.GRAVITY * delta
                }
                if (
                    this.baseLength > ZILCH &&
                    Math.abs(this.zVelocity) > ZILCH
                ) {
                    var expectedDZ = this.zVelocity * delta
                    var actualDZ = this.mover.zeldaVerticalBump(expectedDZ)
                    if (Math.abs(actualDZ) <= ZILCH) {
                        this.zVelocity = 0
                    }
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
                splitTime.Logger.error(e)
            }
        }

        notifyPlayerInteract() {
            this.playerInteractHandlers.run()
        }

        //Function run every frame
        registerFrameUpdateHandler(
            handler: ((delta: real_seconds) => any) | splitTime.FrameNotified
        ) {
            this.frameUpdateHandlers.register(handler)
        }

        registerTimeAdvanceListener(
            handler: ((delta: game_seconds) => any) | splitTime.TimeNotified
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
