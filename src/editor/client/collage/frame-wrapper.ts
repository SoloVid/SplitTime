namespace splitTime.editor.collage {
    export class FrameWrapper implements file.collage.Frame {

        constructor(
            private readonly frameBacking: file.collage.Frame,
            private readonly collage: file.Collage
        ) {}

        delete(): void {
            const id = this.id
            for (const montage of this.collage.montages) {
                montage.frames = montage.frames.filter(mf => mf.frameId !== id)
            }
            this.collage.frames = this.collage.frames.filter(f => f.id !== id)
        }

        get id(): string {
            return this.frameBacking.id
        }
        set id(newId: string) {
            if (newId === "") {
                throw new Error("Frame ID should not be blank")
            }

            const oldId = this.frameBacking.id
            for (const frame of this.collage.frames) {
                if (frame !== this.frameBacking && frame.id === newId) {
                    throw new Error("Frame ID " + newId + " already taken")
                }
            }
            this.frameBacking.id = newId
            for (const montage of this.collage.montages) {
                for (const mf of montage.frames) {
                    if (mf.frameId === oldId) {
                        mf.frameId = newId
                    }
                }
            }
        }

        get x(): int {
            return this.frameBacking.x
        }
        set x(newX: int) {
            this.frameBacking.x = newX
        }

        get y(): int {
            return this.frameBacking.y
        }

        set y(newY: int) {
            this.frameBacking.y = newY
        }

        get width(): int {
            return this.frameBacking.width
        }
        set width(newWidth: int) {
            this.frameBacking.width = newWidth
        }

        get height(): int {
            return this.frameBacking.height
        }
        set height(newHeight: int) {
            this.frameBacking.height = newHeight
        }
    }
}