namespace splitTime.editor.collage {
    interface VueCollageLayout extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        collageEditorShared: CollageEditorShared
        // data
        editorPadding: number
        // computed
        collage: file.Collage
        containerWidth: number
        containerHeight: number
        framesSorted: file.collage.Frame[]
        viewBox: string
        // asyncComputed
        backgroundSrc: string
        // methods
        // handleKeyDown(event: KeyboardEvent): void
        startNewFrame(): void
    }

    function data(this: VueCollageLayout): Partial<VueCollageLayout> {
        return {
            editorPadding: EDITOR_PADDING
        }
    }

    function collage(this: VueCollageLayout): file.Collage {
        return this.collageEditorShared.collage
    }

    function containerWidth(this: VueCollageLayout): number {
        // TODO: real width
        const width = 500
        return width + 2*EDITOR_PADDING
    }
    function containerHeight(this: VueCollageLayout): number {
        // TODO: real height
        const height = 500
        return height + 2*EDITOR_PADDING
    }

    function framesSorted(this: VueCollageLayout): file.collage.Frame[] {
        const frameArrayCopy = this.collage.frames.slice()
        frameArrayCopy.sort((a, b) => {
            if (a === this.collageEditorShared.selectedFrame) {
                return 1
            }
            if (b === this.collageEditorShared.selectedFrame) {
                return -1
            }
            return 0
        })
        return frameArrayCopy
    }

    function viewBox(this: VueCollageLayout): string {
        return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight
    }

    function backgroundSrc(this: VueCollageLayout): PromiseLike<string> {
        return this.collageEditorShared.server.imgSrc(this.collage.image)
    }

    function startNewFrame(this: VueCollageLayout): void {
        const mouse = client.getRelativeMouse(this.editorInputs, this)
        let frameIndex = this.collage.frames.length
        let frameId = "Frame " + frameIndex
        while (this.collage.frames.some(f => f.id === frameId)) {
            frameIndex++
            frameId = "Frame " + frameIndex
        }
        const gridCell = this.collageEditorShared.gridCell
        const newFrame: file.collage.Frame = {
            id: frameId,
            x: Math.round((mouse.x - this.editorPadding) / gridCell.x) * gridCell.x,
            y: Math.round((mouse.y - this.editorPadding) / gridCell.y) * gridCell.y,
            width: MIN_FRAME_LEN,
            height: MIN_FRAME_LEN
        }
        this.collage.frames.push(newFrame)
        this.collageEditorShared.trackFrame(newFrame, {x: newFrame.x + newFrame.width, y: newFrame.y + newFrame.height})
    }

    Vue.component("collage-layout", {
        props: {
            editorInputs: Object,
            collageEditorShared: Object
        },
        data,
        computed: {
            collage,
            containerWidth,
            containerHeight,
            framesSorted,
            viewBox
        },
        asyncComputed: {
            backgroundSrc
        },
        methods: {
            // handleKeyDown,
            startNewFrame
        },
        template: `
<div
    style="position: relative; cursor: crosshair;"
    class="transparency-checkerboard-background"
    @mousedown.right.prevent="startNewFrame"
    @contextmenu.prevent
>
    <div :style="{ padding: editorPadding + 'px' }">
        <img
            v-if="!!backgroundSrc"
            :src="backgroundSrc"
        />
    </div>
    <svg
        style="position:absolute; left: 0; top: 0; width: 100%; height: 100%"
    >
        <frame-rectangle v-for="frame in framesSorted"
            :key="frame.id"
            :collage-editor-shared="collageEditorShared"
            :frame="frame"
            :offset="{x: editorPadding, y: editorPadding}"
        ></frame-rectangle>
    </svg>
    <grid-lines
        v-if="collageEditorShared.gridEnabled"
        :grid-cell="collageEditorShared.gridCell"
        :origin="{x: editorPadding, y: editorPadding}"
    ></grid-lines>
</div>
        `,
    })
}