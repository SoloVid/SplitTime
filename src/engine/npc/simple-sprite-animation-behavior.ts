export {};
// namespace splitTime.npc {
//     export class SimpleSpriteAnimationBehavior implements Behavior, ConditionalBehavior {
//         private timeWithoutSeeing: splitTime.game_seconds = Number.POSITIVE_INFINITY
//         BLIND_TIME: splitTime.game_seconds = 2
//         TERMINATION_TIME: splitTime.game_seconds = 5
//         sightDistance: pixels_t = 256
//         senseDistance: pixels_t
//         moveStance: string = "run"
//         chaseSpeed: pixels_t = 32
//         private distanceToKeep = 32
//         private chasingRadiansOff = 0
//         private temporaryDirectionBlacklist = {}
//         constructor(
//             private readonly npc: splitTime.Npc,
//             private readonly bodyToChaseGetter: () => Body,
//             private readonly howCloseToGet: number,
//             // private readonly getDirectionWeights: () => Record<direction_t, number>
//         ) {
//             this.senseDistance = 2 * this.npc.body.width
//         }
//         private inLevel(): boolean {
//             return this.npc.body.getLevel() === this.bodyToChaseGetter().getLevel()
//         }
//         isConditionMet(): boolean {
//             if (!this.inLevel()) {
//                 return false
//             }
//             if (this.timeWithoutSeeing < this.TERMINATION_TIME) {
//                 return true
//             }
//             return this.canDetect()
//         }
//         notifyTimeAdvance(delta: splitTime.game_seconds): void {
//             this.npc.sprite.requestStance(this.moveStance, this.npc.body.dir)
//         }
//     }
// }
