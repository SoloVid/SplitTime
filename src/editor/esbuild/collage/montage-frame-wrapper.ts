import { Collage, MontageFrame } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { ImmutableSetter } from "../preact-help"
import { SimplifiedMontageFrame } from "./properties-stuffs"

function findMontageFrame(mf: Immutable<MontageFrame>, collage: Immutable<Collage>) {
    for (let i = 0; i < collage.montages.length; i++) {
        const m = collage.montages[i]
        for (let j = 0; j < m.frames.length; j++) {
            if (m.frames[j] === mf) {
                return [m.id, j] as const
            }
        }
    }
    throw new Error(`Unable to find MontageFrame ${JSON.stringify(mf)}`)
}

export class MontageFrameWrapper implements SimplifiedMontageFrame {

    private deleted = false
    private readonly montageId: string
    private readonly frameIndex: number
    private readonly setCollageExternal: ImmutableSetter<Collage>

    constructor(
        initialMontageFrame: Immutable<MontageFrame>,
        private collage: Immutable<Collage>,
        setCollage: ImmutableSetter<Collage>
    ) {
        const [montageId, frameIndex] = findMontageFrame(initialMontageFrame, collage)
        this.montageId = montageId
        this.frameIndex = frameIndex
        this.setCollageExternal = setCollage
    }

    private setCollage(transform: (before: Immutable<Collage>) => Immutable<Collage>) {
        this.setCollageExternal((before) => {
            this.collage = transform(before)
            return this.collage
        })
    }

    private setMontageFrame(newFrame: Partial<Immutable<MontageFrame>>) {
        this.setCollage((before) => ({
            ...before,
            montages: before.montages.map(m => {
                if (m.id !== this.montageId) {
                    return m
                }
                return {
                    ...m,
                    frames: m.frames.map((mf, i) => {
                        if (i !== this.frameIndex) {
                            return mf
                        }
                        return {
                            ...mf,
                            ...newFrame,
                        }
                    }),
                }
            }),
        }))
    }

    delete(): void {
        assert(!this.deleted, `Montage frame already deleted`)
        this.setCollage((before) => ({
            ...before,
            montages: before.montages.map(m => {
                if (m.id !== this.montageId) {
                    return m
                }
                return {
                    ...m,
                    frames: m.frames.filter((m, i) => i !== this.frameIndex)
                }
            }),
        }))
        this.deleted = true
    }

    get montageFrame() {
        for (const m of this.collage.montages) {
            if (m.id === this.montageId) {
                if (m.frames.length > this.frameIndex) {
                    return m.frames[this.frameIndex]
                }
            }
        }
        throw new Error(`Montage frame not found in collage: montage ${this.montageId}, frame ${this.frameIndex}`)
    }

    get frameId(): string {
        return this.montageFrame.frameId
    }
    set frameId(newValue: string) {
        this.setMontageFrame({frameId: newValue})
    }

    get offsetX(): number {
        return this.montageFrame.offsetX
    }
    set offsetX(newValue: number) {
        this.setMontageFrame({offsetX: newValue})
    }

    get offsetY(): number {
        return this.montageFrame.offsetY
    }
    set offsetY(newValue: number) {
        this.setMontageFrame({offsetY: newValue})
    }

    get duration(): number {
        return this.montageFrame.duration
    }
    set duration(newValue: number) {
        this.setMontageFrame({duration: newValue})
    }
}
