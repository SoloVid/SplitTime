namespace splitTime.npc {
    /**
     * Behavior that should only go on for a certain period of time.
     *
     * User of this API should stop calling #notifyTimeAdvance()
     * on a TemporaryBehavior after #isComplete() returns true.
     */
    export interface TemporaryBehavior extends Behavior {
        /**
         * Has this behavior finished its purpose?
         */
        isComplete(): boolean
    }

    export function isBehaviorComplete(b: Behavior): boolean {
        if (!instanceOf.TemporaryBehavior(b)) {
            return false
        }
        return b.isComplete()
    }
}

namespace splitTime.npc.instanceOf {
    export function TemporaryBehavior(thing: Behavior): thing is TemporaryBehavior {
        return typeof (thing as TemporaryBehavior).isComplete === "function"
    }
}
