import { TimeNotified } from "engine/time/timeline";

export interface Behavior extends TimeNotified {
    /**
     * Notify the behavior that, starting this frame,
     * it will indefinitely not receive frame updates.
     */
    notifySuspension?(): void;
}
