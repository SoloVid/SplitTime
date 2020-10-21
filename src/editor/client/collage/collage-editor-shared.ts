namespace splitTime.editor.collage {
    export class SharedStuff implements CollageEditorShared {
        // TODO: make this editable, hard-set now for testing
        gridCell = new Vector2D(32, 32)
        readonly info = {}
        // propertiesPaneStuff: client.ObjectProperties

        constructor(
            private editor: VueCollageEditor
        ) {
            // this.propertiesPaneStuff = getLevelPropertiesStuff(this.editor.level)
        }

        get collage(): file.Collage {
            return this.editor.collage
        }

        get realCollage(): splitTime.Collage {
            return splitTime.collage.makeCollageFromFile(this.collage)
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

        selectMontage(montage: file.collage.Montage): void {
            this.selectedMontage = montage
            this.editor.editorGlobalStuff.setOnDelete(() => {
                const index = this.collage.montages.indexOf(montage)
                this.collage.montages.splice(index, 1)
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            })
        }

        trackFrame(frame: file.collage.Frame, point?: Coordinates2D): void {
            this.selectedFrame = frame
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
            this.editor.editorGlobalStuff.setOnDelete(() => {
                const index = this.collage.frames.indexOf(frame)
                this.collage.frames.splice(index, 1)
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            })
        }
    }
}