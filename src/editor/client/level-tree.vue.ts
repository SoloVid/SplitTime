namespace splitTime.editor.level {
    interface VueLevelTree extends VueComponent {
        // props
        levelEditorShared: LevelEditorShared
        // computed
        level: Level
        // methods
        createLayer(): void
    }

    function level(this: VueLevelTree): Level {
        return this.levelEditorShared.level
    }

    function createLayer(this: VueLevelTree): void {
        const level = this.level
        var assumedRelativeZ = DEFAULT_HEIGHT
        if(level.layers.length > 1) {
            assumedRelativeZ = Math.abs(level.layers[1].obj.z - level.layers[0].obj.z)
        }
        var z = 0
        if(level.layers.length > 0) {
            var previousLayer = level.layers[level.layers.length - 1]
            z = previousLayer.obj.z + assumedRelativeZ
        }
        level.layers.push(withMetadata("layer", {
            id: "",
            z: z
        }))
    }

    Vue.component("level-tree", {
        props: {
            levelEditorShared: Object
        },
        data: function() {
            return {
            }
        },
        computed: {
            level
        },
        methods: {
            createLayer
        },
        template: `
<div>
    <div>
        <menu-layer
                v-for="(layer, index) in levelEditorShared.level.layers"
                :key="index"
                :level-editor-shared="levelEditorShared"
                :level="level"
                :layer="layer"
                :index="index"
        ></menu-layer>
    </div>
    <div class="option" v-on:click.left="createLayer">Add Layer</div>
</div>
        `
    })
}