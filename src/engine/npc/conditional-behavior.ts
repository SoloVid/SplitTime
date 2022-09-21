import { Behavior } from "./behavior";
import { npc } from "../splitTime";
/**
 * Behavior that should only be executed if condition is met.
 *
 * User of this API should not call #notifyTimeAdvance()
 * on a ConditionalBehavior where #isConditionMet() is false.
 */
export interface ConditionalBehavior extends Behavior {
    /**
     * Should this behavior execute this frame?
     */
    isConditionMet(): boolean;
}
export function isBehaviorConditionMet(b: Behavior): boolean {
    if (!npc.instanceOfConditionalBehavior(b)) {
        return true;
    }
    return b.isConditionMet();
}
export function instanceOfConditionalBehavior(thing: Behavior): thing is npc.ConditionalBehavior {
    return typeof (thing as npc.ConditionalBehavior).isConditionMet === "function";
}
