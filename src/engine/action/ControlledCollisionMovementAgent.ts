namespace SplitTime.agent {
    export class ControlledCollisionMovement {
        private body: SplitTime.Body;
        private targetBoardX: number;
        private targetBoardY: number;
        private targetScreenX: number;
        private targetScreenY: number;
        private targetDirection;
        
        public constructor(body: SplitTime.Body) {
            this.setBody(body);
        }
        setBody(body) {
            this.body = body;
            this.resetTarget();
        }
        
        setWalkingTowardBoardLocation(x, y) {
            this.targetBoardX = x;
            this.targetBoardY = y;
        }
        setWalkingTowardScreenLocation(x, y) {
            this.targetScreenX = x;
            this.targetScreenY = y;
        }
        setWalkingDirection(dir) {
            this.targetDirection = dir;
        }
        setStopped() {
            this.resetTarget();
            if(this.body.drawable && typeof this.body.drawable.defaultStance === "function") {
                this.body.drawable.defaultStance();
            }
        }
        notifyFrameUpdate(delta) {
            var walkingDir = this.getWalkingDirection();
            if(walkingDir !== null) {
                this.body.dir = walkingDir;
                if(this.body.drawable && typeof this.body.drawable.requestStance === "function") {
                    this.body.drawable.requestStance("walk", this.body.dir);
                }
                var mover = new SplitTime.body.Mover(this.body);
                mover.horizontal.zeldaStep(this.body.dir, this.body.spd * delta);
            } else {
                if(this.body.drawable && typeof this.body.drawable.defaultStance === "function") {
                    this.body.drawable.defaultStance();
                }
            }
        }
        
        resetTarget() {
            this.targetBoardX = null;
            this.targetBoardY = null;
            this.targetScreenX = null;
            this.targetScreenY = null;
            this.targetDirection = null;
        }
        
        getWalkingDirection() {
            if(this.targetDirection !== null) {
                return this.targetDirection;
            } else if(this.targetBoardX !== null && this.targetBoardY !== null) {
                // TODO: return some calculation
                return 0;
            } else if(this.targetScreenX !== null && this.targetScreenY !== null) {
                // TODO: some other calculation
                return 0;
            }
            return null;
        }
    }
}
