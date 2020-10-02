namespace splitTime.npc {
    export interface Behavior extends TimeNotified {
        /**
         * Only expect this to be checked *after* a call to notifyTimeAdvance()
         */
        isComplete(): boolean
        notifySuspension(): void
    }
}