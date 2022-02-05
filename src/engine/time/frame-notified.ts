import { real_seconds } from "../splitTime";
import * as splitTime from "../splitTime";
export interface FrameNotified {
    /**
     * @param delta number of seconds passed (in real time) since last frame
     */
    notifyFrameUpdate(delta: real_seconds): void;
}
export function instanceOfFrameNotified(obj: unknown): obj is splitTime.FrameNotified {
    return typeof (obj as splitTime.FrameNotified).notifyFrameUpdate === "function";
}
