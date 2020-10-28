namespace splitTime.editor.level {
    export type EditorEntity = Position | Prop | Trace
    export class EntityBodyManager {

        // This field is designed to help get around Vue missing changes to editorIdToBody
        private readonly editorIdToBody: { [editorId: string]: body.GraphBody } = {}
        private readonly placeholderDrawable: body.GraphDrawable

        constructor(
            private readonly level: Level,
            private readonly collageManager: CollageManager
        ) {
            const topLeft = splitTime.collage.getDefaultTopLeft(collage.defaultBodySpec, math.Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH))
            const drawArea = math.Rect.make(topLeft.x, topLeft.y, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
            this.placeholderDrawable = {
                getCanvasRequirements(): splitTime.body.CanvasRequirements {
                    return new splitTime.body.CanvasRequirements(drawArea.copy())
                }
            }
        }

        getUpdatedBody(editorEntity: EditorEntity): body.GraphBody | null {
            const editorId = editorEntity.metadata.editorId
            if (!(editorId in this.editorIdToBody)) {
                // FTODO: don't make full Body
                MaybeVue.set(this.editorIdToBody, editorId, new Body())
            }
            const body = this.editorIdToBody[editorId]
            if (editorEntity.type === "trace") {
                if (!this.applyTrace(body, editorEntity.obj)) {
                    return null
                }
            } else {
                const p = editorEntity.obj
                body.x = p.x
                body.y = p.y
                body.z = p.z
                if (p.collage === "") {
                    this.applyPlaceholder(body)
                } else {
                    try {
                        if (!this.applyProposition(body, p)) {
                            return null
                        }
                    } catch (e: unknown) {
                        this.applyPlaceholder(body)
                    }
                }
            }
            return body
        }

        private applyTrace(body: body.GraphBody, fileTrace: splitTime.level.file_data.Trace): boolean {
            const tracePoints = safeExtractTraceArray(this.level, fileTrace.vertices)
            const nonNullPoints = tracePoints.filter((p): p is Readonly<Coordinates2D> => p !== null)
            const coordsAggregate = nonNullPoints.reduce((result, v) => {
                return {
                    count: result.count + 1,
                    sumCoords: new Coordinates2D(result.sumCoords.x + v.x, result.sumCoords.y + v.y)
                }
            }, { count: 0, sumCoords: new Coordinates2D() })
            if (coordsAggregate.count === 0) {
                return false
            }
            body.x = Math.round(coordsAggregate.sumCoords.x / coordsAggregate.count)
            body.y = Math.round(coordsAggregate.sumCoords.y / coordsAggregate.count)
            body.z = fileTrace.z
            const area = math.calculateTotalArea(nonNullPoints.map(p => new Coordinates2D(p.x - body.x, p.y - body.y)))
            body.width = area.width - (area.width % 2)
            body.depth = area.height - (area.height % 2)
            body.height = fileTrace.height
            area.y -= fileTrace.height
            area.height += fileTrace.height
            const drawable = {
                getCanvasRequirements(): splitTime.body.CanvasRequirements {
                    return new splitTime.body.CanvasRequirements(area)
                }
            }
            body.drawables = [drawable]
            return true
        }

        private applyProposition(body: body.GraphBody, p: splitTime.level.file_data.Prop | splitTime.level.file_data.Position): boolean {
            const collage = this.collageManager.getRealCollage(p.collage)
            const drawable = this.collageManager.getSimpleGraphDrawable(p.collage, p.montage, p.dir)
            if (!collage || !drawable) {
                return false
            }
            let montage: splitTime.collage.Montage
            try {
                montage = collage.getMontage(p.montage, p.dir)
            } catch (e: unknown) {
                montage = collage.getDefaultMontage(p.dir)
            }
            body.drawables = [drawable]
            body.width = montage.bodySpec.width
            body.depth = montage.bodySpec.depth
            body.height = montage.bodySpec.height
            return true
        }

        private applyPlaceholder(body: body.GraphBody): void {
            body.width = collage.defaultBodySpec.width
            body.depth = collage.defaultBodySpec.depth
            body.height = collage.defaultBodySpec.height
            // const topLeft = splitTime.collage.getDefaultTopLeft(collage.defaultBodySpec, math.Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH))
            // const drawArea = math.Rect.make(topLeft.x, topLeft.y, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
            // const drawable = {
            //     getCanvasRequirements(): splitTime.body.CanvasRequirements {
            //         return new splitTime.body.CanvasRequirements(drawArea)
            //     }
            // }
            body.drawables = [this.placeholderDrawable]
        }
    }
}