namespace splitTime.editor.collage {
    interface VueRenderedMontageTrace {
        // props
        collageEditHelper: IVueCollageEditHelper
        collageViewHelper: IVueCollageViewHelper
        montage: file.collage.Montage
        montageFrame: file.collage.MontageFrame
        trace: splitTime.level.file_data.Trace
        // data
        metadata: client.EditorMetadata
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

    function data(this: VueRenderedMontageTrace): Partial<VueRenderedMontageTrace> {
        return {
            metadata: new client.EditorMetadata(),
            tracker: {
                track: (e, p) => {
                    this.track(p)
                    // Somewhat type-unsafe way of letting upper events know they should try to set properties
                    const anyEvent = e as PropertiesEvent
                    anyEvent.propertiesPanelSet = true
                }
            },
            uid: generateUID()
        }
    }

    function acceptMouse(this: VueRenderedMontageTrace): boolean {
        return true
    }

    function pointsArray(this: VueRenderedMontageTrace): (Readonly<Coordinates2D> | null)[] {
        const pointSpecs = splitTime.trace.interpretPointString(this.trace.vertices)
        return splitTime.trace.convertPositions(pointSpecs, {})
    }

    function shouldDragBePrevented(this: VueRenderedMontageTrace): boolean {
        return false
    }

    function track(this: VueRenderedMontageTrace, point?: Coordinates2D): void {
        const trace = this.trace
        const originalPointString = trace.vertices
        const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
        const vertices = this.pointsArray
        const originalPoints = point ? [point] : vertices.filter(instanceOf.Coordinates2D)
        const snappedMover = new client.GridSnapMover(this.collageEditHelper.gridCell, originalPoints)
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
        this.collageEditHelper.follow(follower)
        this.collageEditHelper.editProperties(getTracePropertiesStuff(this.montage, trace))
    }

    Vue.component("rendered-montage-trace", {
        props: {
            collageEditHelper: Object,
            collageViewHelper: Object,
            montage: Object,
            montageFrame: Object,
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
    :server="collageViewHelper.server"
    :should-drag-be-prevented="shouldDragBePrevented"
    :trace="trace"
    :tracker="tracker"
>
</rendered-trace>
        `
    })
}
