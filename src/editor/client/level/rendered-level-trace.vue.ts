namespace splitTime.editor.level {
    interface VueRenderedLevelTrace {
        // props
        levelEditorShared: LevelEditorShared
        metadata: client.EditorMetadata
        trace: splitTime.level.file_data.Trace
        // data
        tracker: client.IRenderedTraceTracker
        uid: string
        // computed
        acceptMouse: boolean
        pointsArray: (Readonly<Coordinates2D> | null)[]
        shouldDragBePrevented: boolean
        // asyncComputed
        // methods
        track(point?: Coordinates2D): void
    }

    function data(this: VueRenderedLevelTrace): Partial<VueRenderedLevelTrace> {
        return {
            tracker: {
                track: (e, p) => this.track(p)
            },
            uid: generateUID()
        }
    }

    function acceptMouse(this: VueRenderedLevelTrace): boolean {
        return inGroup(this.levelEditorShared.level, this.levelEditorShared.activeGroup, this.trace)
    }

    function pointsArray(this: VueRenderedLevelTrace): (Readonly<Coordinates2D> | null)[] {
        return safeExtractTraceArray(this.levelEditorShared.level, this.trace.vertices)
    }

    function shouldDragBePrevented(this: VueRenderedLevelTrace): boolean {
        return this.levelEditorShared.shouldDragBePrevented()
    }

    function track(this: VueRenderedLevelTrace, point?: Coordinates2D): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        const trace = this.trace
        const originalPointString = trace.vertices
        const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
        const vertices = safeExtractTraceArray(this.levelEditorShared.level, trace.vertices)
        const originalPoints = point ? [point] : vertices.filter(instanceOfCoordinates2D)
        const snappedMover = new client.GridSnapMover(this.levelEditorShared.gridCell, originalPoints)
        const follower = {
            shift: (dx: number, dy: number) => {
                snappedMover.applyDelta(dx, dy)
                const snappedDelta = snappedMover.getSnappedDelta()
                var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
                if (originalPoint) {
                    regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
                }
                trace.vertices = originalPointString.replace(regex, function(match, p1, p2) {
                    var newX = Number(p1) + snappedDelta.x
                    var newY = Number(p2) + snappedDelta.y
                    return "(" + newX + ", " + newY + ")"
                })
            }
        }
        this.levelEditorShared.follow(follower)
        this.levelEditorShared.editProperties(getTracePropertiesStuff(this.levelEditorShared.level, this.trace))
    }

    Vue.component("rendered-level-trace", {
        props: {
            levelEditorShared: Object,
            metadata: Object,
            trace: Object
        },
        data,
        computed: {
            acceptMouse,
            pointsArray,
            shouldDragBePrevented
        },
        asyncComputed: {
        },
        methods: {
            track
        },
        template: `
<rendered-trace
    :accept-mouse="acceptMouse"
    :metadata="metadata"
    :points-array="pointsArray"
    :server="levelEditorShared.server"
    :should-drag-be-prevented="shouldDragBePrevented"
    :trace="trace"
    :tracker="tracker"
>
</rendered-trace>
        `
    })
}
