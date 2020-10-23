namespace splitTime.editor.collage {
    export class SharedStuff implements CollageEditorShared {
        readonly info = {}
        propertiesPaneStuff: client.ObjectProperties

        constructor(
            private editor: VueCollageEditor
        ) {
            this.propertiesPaneStuff = getCollagePropertiesStuff(this.editor.collage)
        }

        get collage(): file.Collage {
            return this.editor.collage
        }

        get gridCell(): Vector2D {
            return this.editor.editorGlobalStuff.gridCell
        }

        get gridEnabled(): boolean {
            return this.editor.editorGlobalStuff.gridEnabled
        }

        get realCollage(): splitTime.Collage {
            return splitTime.collage.makeCollageFromFile(this.collage, true)
        }

        selectedFrame: file.collage.Frame | null = null
        selectedMontage: file.collage.Montage | null = null

        get server(): client.ServerLiaison {
            return this.editor.editorGlobalStuff.server
        }

        get time(): game_seconds {
            return this.editor.editorGlobalStuff.time
        }

        follow(follower: client.Followable): void {
            this.editor.editorGlobalStuff.setFollowers([follower])
        }

        selectMontage(montage: file.collage.Montage, andProperties: boolean): void {
            this.selectedMontage = montage
            this.editor.editorGlobalStuff.setOnDelete(() => {
                const index = this.collage.montages.indexOf(montage)
                this.collage.montages.splice(index, 1)
                this.selectedMontage = null
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            })
            if (andProperties) {
                this.propertiesPaneStuff = getMontagePropertiesStuff(montage)
            }
        }

        selectFrame(frame: file.collage.Frame, andProperties: boolean): void {
            this.selectedFrame = frame
            const frameWrapper = new FrameWrapper(frame, this.collage)
            this.editor.editorGlobalStuff.setOnDelete(() => {
                frameWrapper.delete()
                this.selectedFrame = null
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            })
            if (andProperties) {
                this.propertiesPaneStuff = getFramePropertiesStuff(frameWrapper)
            }
        }

        selectMontageFrame(montageFrame: file.collage.MontageFrame, andProperties: boolean): void {
            const frameId = montageFrame.frameId
            const frames = this.collage.frames.filter(f => f.id === frameId)
            if (frames.length === 0) {
                throw new Error("Frame with ID " + frameId + " not found")
            }
            const frame = frames[0]
            this.selectFrame(frame, false)
            this.editor.editorGlobalStuff.setOnDelete(() => {
                for (const m of this.collage.montages) {
                    m.frames = m.frames.filter(f => f !== montageFrame)
                }
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            })
            if (andProperties) {
                this.propertiesPaneStuff = getMontageFramePropertiesStuff(montageFrame)
            }
        }

        trackFrame(frame: file.collage.Frame, point?: Coordinates2D): void {
            this.selectFrame(frame, true)
            const left = frame.x
            const top = frame.y
            const width = frame.width
            const height = frame.height
            const x = point ? point.x : left
            const y = point ? point.y : top
            let originalPoints: Coordinates2D[]
            if (point) {
                originalPoints = [new Coordinates2D(x, y)]
            } else {
                originalPoints = [
                    new Coordinates2D(x, y),
                    new Coordinates2D(x + width, y),
                    new Coordinates2D(x, y + height),
                    new Coordinates2D(x + width, y + height)
                ]
            }
    
            // const MIN_FRAME_LEN = 4
            const snappedMover = new client.GridSnapMover(this.gridCell, originalPoints)
            const follower = {
                shift: (dx: number, dy: number) => {
                    snappedMover.applyDelta(dx, dy)
                    const snappedDelta = snappedMover.getSnappedDelta()
                    if (!point) {
                        frame.x = x + snappedDelta.x
                    } else if (x === left) {
                        const newWidth = width - snappedDelta.x
                        if (newWidth > MIN_FRAME_LEN) {
                            frame.x = x + snappedDelta.x
                            frame.width = newWidth
                        }
                    } else {
                        const newWidth = width + snappedDelta.x
                        if (newWidth > MIN_FRAME_LEN) {
                            frame.width = newWidth
                        }
                    }
                    if (!point) {
                        frame.y = y + snappedDelta.y
                    } else if (y === top) {
                        const newHeight = height - snappedDelta.y
                        if (newHeight > MIN_FRAME_LEN) {
                            frame.y = y + snappedDelta.y
                            frame.height = newHeight
                        }
                    } else {
                        const newHeight = height + snappedDelta.y
                        if (newHeight > MIN_FRAME_LEN) {
                            frame.height = newHeight
                        }
                    }
                }
            }
            this.follow(follower)
        }
    }
}