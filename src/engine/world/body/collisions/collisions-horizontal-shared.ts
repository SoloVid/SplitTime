namespace splitTime.body.collisions {
    export const simpleBlocked = {
        blocked: true,
        bodies: [],
        vStepUpEstimate: Infinity,
        events: [],
        targetOffset: null,
    }

    export interface PixelStepReturn {
        dz: number
        bodiesBlockingPrimary: readonly Body[]
    }

    export interface SimplePixelCollisionReturn {
        blocked: boolean
        bodies: splitTime.Body[]
        vStepUpEstimate: number
        events: string[]
        targetOffset: trace.PointerOffset | null
    }
}
