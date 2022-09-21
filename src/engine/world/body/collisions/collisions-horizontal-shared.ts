import { PointerOffset } from "../../../splitTime.trace"
import { Body } from "../body"

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
    bodies: Body[]
    vStepUpEstimate: number
    events: string[]
    targetOffset: PointerOffset | null
}
