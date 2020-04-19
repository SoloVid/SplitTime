namespace splitTime.body.collisions {
    // FTODO: Bring back these optimizations
    // export class Falling {
    //     isStandingOnBody() {
    //         return false
    //         // TODO
    //         // Check for perfect groundBody.z + groundBody.height === standingBody.z
    //         // Then check for horizontal overlap of bases
    //     }

    //     isPreviousGroundTraceRelevant() {
    //         if (this.mover.bodyExt.previousGroundTraceX >= 0) {
    //             var roundX = Math.floor(this.mover.body.getX())
    //             var roundY = Math.floor(this.mover.body.getY())
    //             var startX = roundX - this.mover.body.halfBaseLength
    //             var xPixels = this.mover.body.baseLength
    //             var startY = roundY - this.mover.body.halfBaseLength
    //             var yPixels = this.mover.body.baseLength
    //             return (
    //                 this.mover.body.z ===
    //                     this.mover.bodyExt.previousGroundTraceZ &&
    //                 startX <= this.mover.bodyExt.previousGroundTraceX &&
    //                 this.mover.bodyExt.previousGroundTraceX <
    //                     startX + xPixels &&
    //                 startY <= this.mover.bodyExt.previousGroundTraceY &&
    //                 this.mover.bodyExt.previousGroundTraceY < startY + yPixels
    //             )
    //         }
    //         return false
    //     }
    // }
}
