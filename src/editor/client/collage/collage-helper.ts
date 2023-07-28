import { Collage, Frame, Montage, MontageFrame } from "engine/file/collage"
import { generateUID } from "engine/utils/misc"

export class CollageHelper {
    constructor(
        private readonly collage: Collage
    ) {}

    newMontage(): Montage {
        let montageIndex = this.collage.montages.length
        let montageId = "montage-" + montageIndex
        while (this.collage.frames.some(m => m.id === montageId)) {
            montageIndex++
            montageId = "montage-" + montageIndex
        }
        let bodySpec = {
            width: defaultBodySpec.width,
            depth: defaultBodySpec.depth,
            height: defaultBodySpec.height
        }
        let propPostProcessor = ""
        let playerOcclusionFadeFactor = 0
        if (this.collage.montages.length > 0) {
            const recentMontage = this.collage.montages[this.collage.montages.length - 1]
            bodySpec.width = recentMontage.body.width
            bodySpec.depth = recentMontage.body.depth
            bodySpec.height = recentMontage.body.height
            propPostProcessor = recentMontage.propPostProcessor
            playerOcclusionFadeFactor = recentMontage.playerOcclusionFadeFactor
        }
        return {
            id: montageId,
            name: montageId,
            direction: "",
            frames: [],
            body: bodySpec,
            traces: [],
            propPostProcessor: propPostProcessor,
            playerOcclusionFadeFactor: playerOcclusionFadeFactor
        }
    }

    newMontageFrame(montage: Montage, frame: Frame): MontageFrame {
        const template = this.getBestMatchMontageFrame(montage, frame)
        return {
            id: generateUID(),
            frame: frame.id,
            offsetX: template.offsetX,
            offsetY: template.offsetY,
            duration: template.duration
        }
    }

    private getBestMatchMontageFrame(montage: Montage, frame: Frame): MontageFrame {
        const try1 = this.getBestMatchMontageFrameWithinMontage(montage, frame)
        if (try1 !== null) {
            return try1
        }
        for (const m of this.collage.montages.slice().reverse()) {
            const try2 = this.getBestMatchMontageFrameWithinMontage(m, frame)
            if (try2 !== null) {
                return try2
            }
        }
        if (montage.frames.length > 0) {
            return montage.frames[montage.frames.length - 1]
        }
        for (const m of this.collage.montages.slice().reverse()) {
            if (m.frames.length > 0) {
                return m.frames[m.frames.length - 1]
            }
        }
        return defaultMontageFrame
    }

    private getBestMatchMontageFrameWithinMontage(montage: Montage, frame: Frame): MontageFrame | null {
        for (const mf of montage.frames.slice().reverse()) {
            if (mf.frame === frame.id) {
                return mf
            }
        }
        return null
    }
}

export const defaultBodySpec = {
    width: 16,
    depth: 16,
    height: 48
}

const defaultMontageFrame = {
    id: "",
    frame: "",
    offsetX: 0,
    offsetY: 0,
    duration: 0.2
}
