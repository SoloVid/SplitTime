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
        viewBox: string
        // asyncComputed
        backgroundSrc: string
        // methods
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
    function viewBox(this: VueCollageLayout): string {
        return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight
    }

    function backgroundSrc(this: VueCollageLayout): PromiseLike<string> {
        return this.collageEditorShared.server.imgSrc(this.collage.image)
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
            viewBox
        },
        asyncComputed: {
            backgroundSrc
        },
        methods: {
        },
        template: `
<div style="position: relative;">
    <img
        v-if="!!backgroundSrc"
        class="background"
        :src="backgroundSrc"
        :style="{ position: 'absolute', 'left': editorPadding + 'px', 'top': editorPadding + 'px' }"
    />
    <svg
        style="position:absolute"
        :width="containerWidth"
        :height="containerHeight"
        :viewBox="viewBox"
    >
        <frame-rectangle v-for="frame in collage.frames"
            :collage-editor-shared="collageEditorShared"
            :frame="frame"
        ></frame-rectangle>
    </svg>
</div>
        `,
    })
}