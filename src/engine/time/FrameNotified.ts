namespace SplitTime {
    export interface FrameNotified {
        /**
        * @param delta number of seconds passed (in real time) since last frame
        */
        notifyFrameUpdate(delta: number): void;
    }

    export namespace instanceOf {
        export function FrameNotified(obj: any): obj is FrameNotified {
            return typeof obj.notifyFrameUpdate === "function";
        }
    }
}
