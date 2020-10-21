namespace splitTime.editor.client {

    interface SvgGridSpec {
        width: number
        height: number
        pathD: string
    }

    interface VueGridLines extends VueComponent {
        // props
        gridCell: Vector2D
        origin: Coordinates2D
        // data
        uid: string
        // computed
        styleObject: object
        smallGrid: SvgGridSpec
        fullGrid: SvgGridSpec
    }

    function data(this: VueGridLines): Partial<VueGridLines> {
        return {
            uid: generateUID()
        }
    }

    function styleObject(this: VueGridLines): object {
        return {
            "pointer-events": "none",
            position: "absolute",
            left: "0",
            top: "0"
        }
    }

    function smallGrid(this: VueGridLines): SvgGridSpec {
        return {
            width: this.gridCell.x,
            height: this.gridCell.y,
            pathD: "M " + this.gridCell.x + " 0 L 0 0 0 " + this.gridCell.y
        }
    }

    const THICK_AT = 10
    function fullGrid(this: VueGridLines): SvgGridSpec {
        const bigCell = this.gridCell.times(THICK_AT)
        return {
            width: bigCell.x,
            height: bigCell.y,
            pathD: "M " + bigCell.x + " 0 L 0 0 0 " + bigCell.y
        }
    }

    Vue.component("grid-lines", {
        props: {
            gridCell: Object,
            origin: Object
        },
        data,
        computed: {
            styleObject,
            smallGrid,
            fullGrid
        },
        // From https://stackoverflow.com/a/14209704/4639640
        template: `
<svg :style="styleObject" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <pattern
            :id="'small-grid-' + uid"
            :width="smallGrid.width" :height="smallGrid.height"
            patternUnits="userSpaceOnUse"
        >
            <path :d="smallGrid.pathD" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
        <pattern
            :id="'grid-' + uid"
            :width="fullGrid.width" :height="fullGrid.height"
            patternUnits="userSpaceOnUse"
            :x="origin.x"
            :y="origin.y"
        >
            <rect :width="fullGrid.width" :height="fullGrid.height" :fill="'url(#small-grid-' + uid + ')'"/>
            <path :d="fullGrid.pathD" fill="none" stroke="gray" stroke-width="1"/>
        </pattern>
    </defs>

    <rect width="100%" height="100%" :fill="'url(#grid-' + uid + ')'" />
</svg>
        `
    })
}