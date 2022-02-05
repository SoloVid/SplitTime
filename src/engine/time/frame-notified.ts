namespace splitTime {
    export interface FrameNotified {
        /**
         * @param delta number of seconds passed (in real time) since last frame
         */
        notifyFrameUpdate(delta: real_seconds): void
    }
}
namespace splitTime.instanceOf {
    export function FrameNotified(obj: unknown): obj is FrameNotified {
        return typeof (obj as FrameNotified).notifyFrameUpdate === "function"
    }
}
