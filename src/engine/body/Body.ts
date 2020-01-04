namespace SplitTime {
    var nextRef = 10; //reserve first 10
    
    export class Body {
        ref: number;
        private frameUpdateHandlers: SLVD.RegisterCallbacks;
        private timeAdvanceListeners: SLVD.RegisterCallbacks;
        private playerInteractHandlers: SLVD.RegisterCallbacks;
        mover: SplitTime.body.Mover;
        speechBox;
        
        // TODO: remove parameter when moving templates elsewhere
        constructor(skipInit = false) {
            this.ref = nextRef++;
            if(!skipInit) {
                this.frameUpdateHandlers = new SLVD.RegisterCallbacks({notifyFrameUpdate: null});
                this.timeAdvanceListeners = new SLVD.RegisterCallbacks({notifyTimeAdvance: null});
                this.playerInteractHandlers = new SLVD.RegisterCallbacks({onPlayerInteract: null});
                this.mover = new SplitTime.body.Mover(this);
                // TODO: sort out (throw out) inheritance to make this work right
                this.speechBox = new SplitTime.body.SpeechBox(this, -42);
            }
        }
        get x() {
            return this.getX();
        }
        set x(newX) {
            this.setX(newX, true);
        }
        get y() {
            return this.getY();
        }
        set y(newY) {
            this.setY(newY, true);
        }
        get z() {
            return this.getZ();
        }
        set z(newZ) {
            this.setZ(newZ, true);
        }
        get level() {
            return this.getLevel();
        }
        set level(newLevel) {
            this.setLevel(newLevel, true);
        }
        get halfBaseLength() {
            return Math.round(this.baseLength / 2);
        }
        
        drawable: SplitTime.body.Drawable | null = null;
        lightIntensity = 0;
        lightRadius = 150;
        shadow = false;
        
        childrenBolted = [];
        childrenLoose = [];
        addChild(child, isBolted) {
            if(isBolted) {
                if(this.childrenBolted.length === 0) {
                    this.childrenBolted = [];
                }
                this.childrenBolted.push(child);
            } else {
                if(this.childrenLoose.length === 0) {
                    this.childrenLoose = [];
                }
                this.childrenLoose.push(child);
            }
        };
        removeChild(child) {
            var i;
            for(i = 0; i < this.childrenBolted.length; i++) {
                if(this.childrenBolted[i] == child) {
                    this.childrenBolted.splice(i, 1);
                    i--;
                }
            }
            for(i = 0; i < this.childrenLoose.length; i++) {
                if(this.childrenLoose[i] == child) {
                    this.childrenLoose.splice(i, 1);
                    i--;
                }
            }
        };
        getChildren() {
            return this.childrenBolted.concat(this.childrenLoose);
        };
        
        isPlayer() {
            return this === SplitTime.playerBody;
        };
        
        staticTrace = [];
        /**
        * @deprecated should be moved to Prop class or something
        */
        addStaticTrace(traceStr, type) {
            if(this.staticTrace.length === 0) {
                this.staticTrace = [];
            }
            this.staticTrace.push({traceStr: traceStr, type: type});
        };
        
        //The SplitTime.Body's base is the collision area of the SplitTime.Body
        baseLength = 16;
        //Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
        baseOffX = 0;
        baseOffY = 0;
        
        _resortInBodyOrganizer() {
            if(this._level) {
                this._level.notifyBodyMoved(this);
            }
        };
        
        private _level: SplitTime.Level = null;
        _x = 0;
        getX() {
            return this._x;
        };
        setX(x, includeChildren = false) {
            if(includeChildren) {
                var children = this.getChildren();
                for(var i = 0; i < children.length; i++) {
                    var currentChild = children[i];
                    var dx = currentChild.getX() - this._x;
                    currentChild.setX(x + dx, true);
                }
            }
            if(x !== this._x) {
                this._x = x;
                this._resortInBodyOrganizer();
            }
        };
        _y = 0;
        getY() {
            return this._y;
        };
        setY(y, includeChildren = false) {
            if(includeChildren) {
                var children = this.getChildren();
                for(var i = 0; i < children.length; i++) {
                    var currentChild = children[i];
                    var dy = currentChild.getY() - this._y;
                    currentChild.setY(y + dy, true);
                }
            }
            if(y !== this._y) {
                this._y = y;
                this._resortInBodyOrganizer();
            }
        };
        _z = 0;
        getZ() {
            return this._z;
        };
        setZ(z, includeChildren = false) {
            if(includeChildren) {
                var children = this.getChildren();
                for(var i = 0; i < children.length; i++) {
                    var currentChild = children[i];
                    var dLayer = currentChild.getZ() - this._z;
                    currentChild.setZ(z + dLayer, true);
                }
            }
            if(z !== this._z) {
                this._z = z;
                this._resortInBodyOrganizer();
            }
        };
        GRAVITY = -1280;
        zVelocity = 0;
        height = 32;
        
        dir = 3;
        
        getLeft(): number {
            return this.getX() - this.baseLength / 2;
        };
        
        getTopY(): number {
            return this.getY() - this.baseLength / 2;
        };
        
        /**
        * @deprecated
        */
        isInCurrentLevel(): boolean {
            return this.getLevel() === SplitTime.Level.getCurrent();
        };
        
        put(level: Level, x: number, y: number, z: number, includeChildren = false) {
            this.setLevel(level, includeChildren);
            this.setX(x, includeChildren);
            this.setY(y, includeChildren);
            this.setZ(z, includeChildren);
        };
        
        putLocation(location: LevelLocation, includeChildren = false) {
            this.put(location.getLevel(), location.getX(), location.getY(), location.getZ(), includeChildren);
        };
        
        setLevel(level: string | SplitTime.Level, includeChildren: boolean = false) {
            if(typeof level === "string") {
                level = SplitTime.Level.get(level);
            }
            
            if(level === this._level) {
                return;
            }
            
            if(this._level) {
                this._level.removeBody(this);
            }
            
            this._level = level;
            if(this._level) {
                this._level.insertBody(this);
            }
            
            if(includeChildren) {
                var children = this.getChildren();
                for(var i = 0; i < children.length; i++) {
                    if(includeChildren) {
                        children[i].setLevel(level, includeChildren);
                    } else {
                        this.removeChild(children[i]);
                    }
                }
            }
            
            if(this.isPlayer()) {
                SplitTime.Level.transition(this._level);
            }
        };
        getLevel(): SplitTime.Level {
            return this._level;
        };
        /**
        * @deprecated perhaps too much clog
        */
        getRegion(): SplitTime.Region {
            var level = this.getLevel();
            if(!level) {
                return SplitTime.Region.getDefault();
            }
            return level.getRegion();
        };
        
        notifyFrameUpdate(delta) {
            this.frameUpdateHandlers.run(delta);
            try {
                if(this.drawable && SplitTime.instanceOf.FrameNotified(this.drawable)) {
                    this.drawable.notifyFrameUpdate(delta);
                }
            } catch(e) {
                SplitTime.Logger.error(e);
            }
        }
        
        notifyTimeAdvance(delta) {
            this.timeAdvanceListeners.run(delta);
        
            var level = this.getLevel();
            var region = level ? level.getRegion() : null;
            if(region === SplitTime.Region.getCurrent()) {
                var ZILCH = 0.00001;
                if(this.baseLength > ZILCH) {
                    this.zVelocity += this.GRAVITY * delta;
                }
                if(this.baseLength > ZILCH && Math.abs(this.zVelocity) > ZILCH) {
                    var expectedDZ = this.zVelocity * delta;
                    var actualDZ = this.mover.zeldaVerticalBump(expectedDZ);
                    if(Math.abs(actualDZ) <= ZILCH) {
                        this.zVelocity = 0;
                    }
                }
            }
        
            try {
                if(this.drawable && SplitTime.instanceOf.TimeNotified(this.drawable)) {
                    this.drawable.notifyTimeAdvance(delta);
                }
            } catch(e) {
                SplitTime.Logger.error(e);
            }
        }

        notifyPlayerInteract() {
            this.playerInteractHandlers.run();
        };
        
        //Function run every frame
        registerFrameUpdateHandler(handler: ((delta: number) => any) | SplitTime.main.FrameNotified) {
            this.frameUpdateHandlers.register(handler);
        };

        registerTimeAdvanceListener(handler: ((delta: number) => any) | SplitTime.TimeNotified) {
            this.timeAdvanceListeners.register(handler);
        };
        
        //Function run on ENTER or SPACE
        registerPlayerInteractHandler(handler) {
            this.playerInteractHandlers.register(handler);
        };

        // Generally equates to pixels per second (game time)
        spd = 2;
    }
}
