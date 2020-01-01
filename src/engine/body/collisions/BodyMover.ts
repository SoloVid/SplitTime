namespace SplitTime.body {
    /**
    * @type {Object.<int, BodyExt>}
    */
    var bodyMap = {};
    
    /**
    * @param {SplitTime.Body} body
    * @constructor
    */
    function BodyExt(body) {
        this.bumped = false;
        this.pushing = false;
        this.sliding = false;
        this.previousGroundBody = null;
        this.previousGroundTraceX = -1;
        this.previousGroundTraceY = -1;
        this.previousGroundTraceZ = -1;
    }
    
    /**
    * @param {SplitTime.Body} body
    * @returns {BodyExt}
    */
    function getBodyExt(body) {
        if(!(body.ref in bodyMap)) {
            bodyMap[body.ref] = new BodyExt(body);
        }
        
        return bodyMap[body.ref];
    }
    
    /**
    * @param {SplitTime.Body} body
    * @constructor
    */
    export class Mover {
        body: SplitTime.Body;
        level: SplitTime.Level;
        bodyExt: any;
        baseLength: number;
        halfBaseLength: number;
        height: number;
        dir: any;
        horizontal: collisions.Horizontal;
        rising: collisions.Rising;
        falling: collisions.Falling;
        constructor(body) {
            this.body = body;
            /** @type {SplitTime.Level} */
            this.level = body.getLevel();
            this.bodyExt = getBodyExt(this.body);
            
            this.baseLength = this.body.baseLength;
            this.halfBaseLength = Math.round(this.baseLength / 2);
            this.height = this.body.height;

            this.horizontal = new collisions.Horizontal(this);
            this.rising = new collisions.Rising(this);
            this.falling = new collisions.Falling(this);
        }
        
        static VERTICAL_FUDGE = 4;
        
        /**
        * Zelda step with input direction
        * @param distance
        * @param direction
        * @returns {boolean}
        */
        zeldaBump(distance, direction) {
            this.ensureInRegion();
            //Prevent infinite recursion
            if(this.bodyExt.pushing || (this.bodyExt.bumped && !this.bodyExt.sliding)) {
                return false;
            }
            this.bodyExt.bumped = true;
            
            //Save direction
            var tDir = this.dir;
            //Set direction
            this.dir = direction;
            //Bump
            var moved = this.horizontal.zeldaStep(direction, distance);
            //Revert direction;
            this.dir = tDir;
            
            this.bodyExt.bumped = false;
            return moved > 0;
        }
        
        /**
        * Check that body is in current region
        */
        ensureInRegion() {
            if(this.body.getLevel().getRegion() !== SplitTime.Region.getCurrent()) {
                throw new Error("Attempt to do zelda movement for body not in current region");
            }
        }
        
        /**
        * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
        * @param {number} maxDZ
        * @returns {number} Z pixels actually moved
        */
        zeldaVerticalBump(maxDZ) {
            this.ensureInRegion();
            
            var actualDZ;
            if(Math.abs(maxDZ) < 0.000001) {
                // do nothing
                return 0;
            } else if(maxDZ > 0) {
                actualDZ = this.rising.zeldaVerticalRise(maxDZ);
                return actualDZ;
            } else if(this.body.z > 0) {
                actualDZ = this.falling.zeldaVerticalDrop(-maxDZ);
                return actualDZ;
            }
            
            return 0;
        }
        
        /**
        *
        * @param {Object<string, boolean>} levelIdSet
        */
        transportLevelIfApplicable(levelIdSet) {
            var id = null;
            for(var key in levelIdSet) {
                if(id !== null) {
                    return;
                }
                id = key;
            }
            if(id === null) {
                return;
            }
            var transporter = new SplitTime.body.Transporter(this.body);
            transporter.transportLevelIfApplicable(id);
        }
    }
}