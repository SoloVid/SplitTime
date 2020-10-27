namespace splitTime.editor.collage {
    interface VueFrameRectangle extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        frame: file.collage.Frame
        offset: Coordinates2D
        // data
        // computed
        backgroundSrc: string
        collage: file.Collage
        grabBox: math.Rect
        isSelected: boolean
        traceFill: string
        traceStroke: string
        vertices: Coordinates2D[]
        // asyncComputed
        // methods
        track(point?: Coordinates2D): void
        addToMontage(): void
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

    function backgroundSrc(this: VueFrameRectangle): string {
        return this.collageEditorShared.server.imgSrc(this.collage.image)
    }

    function track(this: VueFrameRectangle, point?: Coordinates2D): void {
        this.collageEditorShared.trackFrame(this.frame, point)
    }

    function addToMontage(this: VueFrameRectangle): void {
        const montage = this.collageEditorShared.selectedMontage
        if (montage === null) {
            return
        }
        const collageHelper = new CollageHelper(this.collage)
        const newMontageFrame = collageHelper.newMontageFrame(montage, this.frame)
        montage.frames.push(newMontageFrame)
    }

    Vue.component("frame-rectangle", {
        props: {
            collageEditorShared: Object,
            frame: Object,
            offset: Object
        },
        data,
        computed: {
            backgroundSrc,
            collage,
            grabBox,
            isSelected,
            traceFill,
            traceStroke,
            vertices
        },
        asyncComputed: {
        },
        methods: {
            track,
            addToMontage
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
        @dblclick.left="addToMontage"
    />
</g>
        `,
    })
}