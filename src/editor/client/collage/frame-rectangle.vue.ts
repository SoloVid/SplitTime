namespace splitTime.editor.collage {
    interface VueFrameRectangle extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        frame: file.collage.Frame
        offset: Coordinates2D
        // data
        // computed
        collage: file.Collage
        grabBox: math.Rect
        isSelected: boolean
        traceFill: string
        traceStroke: string
        vertices: Coordinates2D[]
        // asyncComputed
        backgroundSrc: string
        // methods
        track(point?: Coordinates2D): void
    }

    function data(this: VueFrameRectangle): Partial<VueFrameRectangle> {
        return {
        }
    }

    function collage(this: VueFrameRectangle): file.Collage {
        return this.collageEditorShared.collage
    }

    const GRAB_BOX_WIDTH = 8
    function grabBox(this: VueFrameRectangle): math.Rect {
        return math.Rect.make(
            this.frame.x + this.frame.width / 2 - GRAB_BOX_WIDTH / 2,
            this.frame.y + this.frame.height / 2 - GRAB_BOX_WIDTH / 2,
            GRAB_BOX_WIDTH,
            GRAB_BOX_WIDTH
        )
    }

    function isSelected(this: VueFrameRectangle): boolean {
        return this.collageEditorShared.selectedFrame === this.frame
    }

    function traceFill(this: VueFrameRectangle): string {
        if (this.isSelected) {
            return "rgba(255, 255, 0, 0.5)"
        }
        return "none"
    }

    function traceStroke(this: VueFrameRectangle): string {
        if (this.isSelected) {
            return "red"
        }
        return "black"
    }

    function vertices(this: VueFrameRectangle): Coordinates2D[] {
        const left = this.frame.x
        const top = this.frame.y
        const right = left + this.frame.width
        const bottom = top + this.frame.height
        return [
            new Coordinates2D(left, top),
            new Coordinates2D(right, top),
            new Coordinates2D(left, bottom),
            new Coordinates2D(right, bottom)
        ]
    }

    function backgroundSrc(this: VueFrameRectangle): PromiseLike<string> {
        return this.collageEditorShared.server.imgSrc(this.collage.image)
    }

    function track(this: VueFrameRectangle, point?: Coordinates2D): void {
        // this.collageEditorShared.selectedFrame = this.frame
        // const left = this.frame.x
        // const top = this.frame.y
        // const width = this.frame.width
        // const height = this.frame.height
        // const x = point ? point.x : left
        // const y = point ? point.y : top
        // let originalPoints: Coordinates2D[]
        // if (point) {
        //     originalPoints = [new Coordinates2D(x, y)]
        // } else {
        //     originalPoints = [
        //         new Coordinates2D(x, y),
        //         new Coordinates2D(x + width, y),
        //         new Coordinates2D(x, y + height),
        //         new Coordinates2D(x + width, y + height)
        //     ]
        // }

        // const MIN_FRAME_LEN = 4
        // const snappedMover = new client.GridSnapMover(this.collageEditorShared.gridCell, originalPoints)
        // const follower = {
        //     shift: (dx: number, dy: number) => {
        //         snappedMover.applyDelta(dx, dy)
        //         const snappedDelta = snappedMover.getSnappedDelta()
        //         if (!point) {
        //             this.frame.x = x + snappedDelta.x
        //         } else if (x === left) {
        //             const newWidth = width - snappedDelta.x
        //             if (newWidth > MIN_FRAME_LEN) {
        //                 this.frame.x = x + snappedDelta.x
        //                 this.frame.width = newWidth
        //             }
        //         } else {
        //             const newWidth = width + snappedDelta.x
        //             if (newWidth > MIN_FRAME_LEN) {
        //                 this.frame.width = newWidth
        //             }
        //         }
        //         if (!point) {
        //             this.frame.y = y + snappedDelta.y
        //         } else if (y === top) {
        //             const newHeight = height - snappedDelta.y
        //             if (newHeight > MIN_FRAME_LEN) {
        //                 this.frame.y = y + snappedDelta.y
        //                 this.frame.height = newHeight
        //             }
        //         } else {
        //             const newHeight = height + snappedDelta.y
        //             if (newHeight > MIN_FRAME_LEN) {
        //                 this.frame.height = newHeight
        //             }
        //         }
        //     }
        // }
        this.collageEditorShared.trackFrame(this.frame, point)
    }

    Vue.component("frame-rectangle", {
        props: {
            collageEditorShared: Object,
            frame: Object,
            offset: Object
        },
        data,
        computed: {
            collage,
            grabBox,
            isSelected,
            traceFill,
            traceStroke,
            vertices
        },
        asyncComputed: {
            backgroundSrc
        },
        methods: {
            track
        },
        template: `
<g>
    <!-- Outline -->
    <rect
        :x="frame.x + offset.x"
        :y="frame.y + offset.y"
        :width="frame.width"
        :height="frame.height"
        :stroke="traceStroke"
        stroke-width="2"
        :fill="traceFill"
    />
    <!-- Points around edge for dragging -->
    <template v-if="isSelected" v-for="(vertex) in vertices">
        <circle
            @mousedown.left="track(vertex)"
            style="cursor: grab;"
            class="hoverable"
            fill="purple"
            :cx="vertex.x + offset.x"
            :cy="vertex.y + offset.y"
            r="4"
        />
    </template>
    <!-- Box in middle for selecting/grabbing -->
    <rect
        style="cursor: grab;"
        :x="grabBox.x + offset.x"
        :y="grabBox.y + offset.y"
        :width="grabBox.width"
        :height="grabBox.height"
        stroke="red"
        stroke-width="2"
        fill="purple"
        @mousedown.left="track()"
    />
</g>
        `,
    })
}