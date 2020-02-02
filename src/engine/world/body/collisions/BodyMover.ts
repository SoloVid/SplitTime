namespace SplitTime.body {
    class BodyExt {
        bumped: boolean = false
        pushing: boolean = false
        sliding: boolean = false
        previousGroundBody: Body | null = null
        previousGroundTraceX: int = -1
        previousGroundTraceY: int = -1
        previousGroundTraceZ: int = -1
    }

    export class Mover {
        body: SplitTime.Body
        bodyExt: any
        dir: any
        horizontal: collisions.Horizontal
        rising: collisions.Rising
        falling: collisions.Falling
        constructor(body: Body) {
            this.body = body
            this.bodyExt = new BodyExt()

            this.horizontal = new collisions.Horizontal(this)
            this.rising = new collisions.Rising(this)
            this.falling = new collisions.Falling(this)
        }

        static VERTICAL_FUDGE = 4

        /**
         * Zelda step with input direction
         */
        zeldaBump(distance: number, direction: number): boolean {
            this.ensureInRegion()
            //Prevent infinite recursion
            if (
                this.bodyExt.pushing ||
                (this.bodyExt.bumped && !this.bodyExt.sliding)
            ) {
                return false
            }
            this.bodyExt.bumped = true

            //Save direction
            var tDir = this.dir
            //Set direction
            this.dir = direction
            //Bump
            var moved = this.horizontal.zeldaStep(direction, distance)
            //Revert direction;
            this.dir = tDir

            this.bodyExt.bumped = false
            return moved > 0
        }

        /**
         * Check that body is in current region
         */
        ensureInRegion() {
            // TODO: maybe reimplement this?
            // if(this.body.getLevel().getRegion() !== SplitTime.Region.getCurrent()) {
            //     throw new Error("Attempt to do zelda movement for body not in current region");
            // }
        }

        /**
         * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
         * @param {number} maxDZ
         * @returns {number} Z pixels actually moved
         */
        zeldaVerticalBump(maxDZ: number): number {
            this.ensureInRegion()

            var actualDZ
            if (Math.abs(maxDZ) < 0.000001) {
                // do nothing
                return 0
            } else if (maxDZ > 0) {
                actualDZ = this.rising.zeldaVerticalRise(maxDZ)
                return actualDZ
            } else if (this.body.z > 0) {
                actualDZ = this.falling.zeldaVerticalDrop(-maxDZ)
                return actualDZ
            }

            return 0
        }

        /**
         *
         * @param {Object<string, boolean>} levelIdSet
         */
        transportLevelIfApplicable(levelIdSet: { [s: string]: boolean }) {
            var id = null
            for (var key in levelIdSet) {
                if (id !== null) {
                    return
                }
                id = key
            }
            if (id === null) {
                return
            }
            var transporter = new SplitTime.body.Transporter(this.body)
            transporter.transportLevelIfApplicable(id)
        }
    }
}
