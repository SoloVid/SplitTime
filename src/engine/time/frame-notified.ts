import { real_seconds } from "./timeline";

export interface FrameNotified {
    /**
     * @param delta number of seconds passed (in real time) since last frame
     */
    notifyFrameUpdate(delta: real_seconds): void;
}
export function instanceOfFrameNotified(obj: unknown): obj is FrameNotified {
    return typeof (obj as FrameNotified).notifyFrameUpdate === "function";
}
