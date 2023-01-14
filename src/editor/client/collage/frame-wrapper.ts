import { int } from "api"
import { Collage, Frame } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter } from "../preact-help"

export class FrameWrapper implements Frame {

    private _id: string
    private readonly setCollageExternal: ImmutableSetter<Collage>

    constructor(
        frameBacking: Immutable<Frame>,
        private collage: Immutable<Collage>,
        setCollage: ImmutableSetter<Collage>
    ) {
        this._id = frameBacking.id
        this.setCollageExternal = setCollage
    }

    private setCollage(transform: (before: Immutable<Collage>) => Immutable<Collage>) {
        this.setCollageExternal((before) => {
            this.collage = transform(before)
            return this.collage
        })
    }

    private setFrame(newFrame: Partial<Immutable<Frame>>) {
        this.setCollage((before) => ({
            ...before,
            frames: before.frames.map(f => {
                if (f.id !== this.id) {
                    return f
                }
                return {
                    ...f,
                    ...newFrame,
                }
            }),
        }))
    }

    delete(): void {
        const id = this.id
        this.setCollage((before) => ({
            ...before,
            montages: before.montages.map(m => ({
                ...m,
                frames: m.frames.filter(mf => mf.frameId !== id),
            })),
            frames: before.frames.filter(f => f.id !== id),
        }))
    }

    get frame() {
        for (const f of this.collage.frames) {
            if (f.id === this.id) {
                return f
            }
        }
        throw new Error(`Frame ${this.id} not found in collage`)
    }

    get id() {
        return this._id
    }

    set id(newId: string) {
        if (newId === "") {
            throw new Error("Frame ID should not be blank")
        }

        if (newId === this.id) {
            return
        }

        const oldId = this._id
        for (const frame of this.collage.frames) {
            if (frame.id === newId) {
                throw new Error("Frame ID " + newId + " already taken")
            }
        }

        this.setCollage((before) => ({
            ...before,
            frames: before.frames.map(f => {
                if (f.id !== oldId) {
                    return f
                }
                return {
                    ...f,
                    id: newId,
                }
            }),
            montages: before.montages.map(m => ({
                ...m,
                frames: m.frames.map(mf => {
                    if (mf.frameId !== oldId) {
                        return mf
                    }
                    return {
                        ...mf,
                        id: newId,
                    }
                })
            }))
        }))
        this._id = newId
    }

    get x(): int {
        return this.frame.x
    }
    set x(newX: int) {
        this.setFrame({x: newX})
    }

    get y(): int {
        return this.frame.y
    }

    set y(newY: int) {
        this.setFrame({y: newY})
    }

    get width(): int {
        return this.frame.width
    }
    set width(newWidth: int) {
        this.setFrame({width: newWidth})
    }

    get height(): int {
        return this.frame.height
    }
    set height(newHeight: int) {
        this.setFrame({height: newHeight})
    }
}

export function updateFrameId(setCollage: ImmutableSetter<Collage>, oldId: string, newId: string) {
    setCollage((before) => ({
        ...before,
        frames: before.frames.map(f => {
            if (f.id !== oldId) {
                return f
            }
            return {
                ...f,
                id: newId,
            }
        }),
        montages: before.montages.map(m => ({
            ...m,
            frames: m.frames.map(mf => {
                if (mf.frameId !== oldId) {
                    return mf
                }
                return {
                    ...mf,
                    id: newId,
                }
            })
        }))
    }))
}
