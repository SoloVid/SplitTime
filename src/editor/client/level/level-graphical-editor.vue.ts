namespace splitTime.editor.level {
    interface VueLevelGraphicalEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        levelEditorShared: LevelEditorShared
        // data
        cancelNextContextMenu: boolean
        // computed
        level: Level
        inputs: client.UserInputs
        position: Coordinates2D
        containerWidth: number
        containerHeight: number
        leftPadding: number
        topPadding: number
        // asyncComputed
        backgroundSrc: string
        // methods
        createPosition(): void
        createProp(): void
        handleContextMenu(event: Event): void
        handleMouseUp(event: MouseEvent): void
        handleMouseMove(event: MouseEvent): void
    }

    function level(this: VueLevelGraphicalEditor): Level {
        return this.levelEditorShared.level
    }

    function inputs(this: VueLevelGraphicalEditor): client.UserInputs {
        const mouse = {
            x: this.editorInputs.mouse.x - this.position.x - EDITOR_PADDING,
            y: this.editorInputs.mouse.y - this.position.y - EDITOR_PADDING,
            // FTODO: only is down when inside level editor
            isDown: this.editorInputs.mouse.isDown
        }
        return {
            mouse,
            ctrlDown: this.editorInputs.ctrlDown
        }
    }

    function position(this: VueLevelGraphicalEditor): Coordinates2D {
        if (!this.$el) {
            return {
                x: 0,
                y: 0
            }
        }
        const $pos = $(this.$el).position()
        return {
            x: $pos.left,
            y: $pos.top
        }
    }

    function containerWidth(this: VueLevelGraphicalEditor): number {
        return this.level.width + 2*EDITOR_PADDING
    }
    function containerHeight(this: VueLevelGraphicalEditor): number {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].obj.z : 0
        return this.level.height + 2*EDITOR_PADDING + addedHeight
    }
    function leftPadding(this: VueLevelGraphicalEditor): number {
        return EDITOR_PADDING + this.level.backgroundOffsetX
    }
    function topPadding(this: VueLevelGraphicalEditor): number {
        return EDITOR_PADDING + this.level.backgroundOffsetY
    }

    function backgroundSrc(this: VueLevelGraphicalEditor): PromiseLike<string> {
        return this.levelEditorShared.server.imgSrc(this.level.background)
    }

    function createPosition(this: VueLevelGraphicalEditor) {
        var layerIndex = this.levelEditorShared.activeLayer
        var z = this.level.layers[layerIndex].obj.z
        var x = this.inputs.mouse.x
        var y = this.inputs.mouse.y + z
        
        var object = {
            id: "",
            collage: "",
            montage: "",
            x: x,
            y: y,
            z: z,
            dir: "S"
        }
        const newThing = client.withMetadata<"position", splitTime.level.file_data.Position>("position", object)
        this.level.positions.push(newThing)
        this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(newThing.obj)
    }
    
    function createProp(this: VueLevelGraphicalEditor) {
        var layerIndex = this.levelEditorShared.activeLayer
        var z = this.level.layers[layerIndex].obj.z
        var x = this.inputs.mouse.x
        var y = this.inputs.mouse.y + z
        
        var object = {
            id: "",
            collage: "",
            montage: "",
            x: x,
            y: y,
            z: z,
            dir: "S",
            playerOcclusionFadeFactor: 0
        }

        const newThing = client.withMetadata<"prop", splitTime.level.file_data.Prop>("prop", object)
        this.level.props.push(newThing)
        this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(newThing.obj)
    }

    function handleContextMenu(this: VueLevelGraphicalEditor, event: Event): void {
        if(this.cancelNextContextMenu) {
            event.preventDefault()
        }
        this.cancelNextContextMenu = false
    }

    function handleMouseUp(this: VueLevelGraphicalEditor, event: MouseEvent): void {
        const z = this.level.layers[this.levelEditorShared.activeLayer].obj.z
        const yOnLayer = this.inputs.mouse.y + z
        const x = this.inputs.mouse.x
        const isLeftClick = event.which === 1
        const isRightClick = event.which === 3
        if(this.levelEditorShared.mode === "trace") {
            var literalPoint = "(" +
                Math.floor(x) + ", " +
                Math.floor(yOnLayer) + ")"
            var closestPosition = findClosestPosition(this.level, this.inputs.mouse.x, yOnLayer)
            var positionPoint = closestPosition ? "(pos:" + closestPosition.obj.id + ")" : ""
            const pathInProgress = this.levelEditorShared.pathInProgress
            if(isLeftClick) {
                if(pathInProgress) {
                    if(this.levelEditorShared.typeSelected == "path" && this.inputs.ctrlDown) {
                        pathInProgress.vertices = pathInProgress.vertices + " " + positionPoint
                    } else {
                        pathInProgress.vertices = pathInProgress.vertices + " " + literalPoint
                    }
                }
            } else if(isRightClick) {
                if(!pathInProgress) {
                    var trace = addNewTrace(this.level, this.levelEditorShared.activeLayer, this.levelEditorShared.typeSelected)
                    
                    if(this.levelEditorShared.typeSelected == splitTime.trace.Type.PATH && !this.inputs.ctrlDown) {
                        trace.obj.vertices = positionPoint
                    } else {
                        trace.obj.vertices = literalPoint
                    }
                    
                    this.levelEditorShared.pathInProgress = trace.obj
                    this.levelEditorShared.propertiesPaneStuff = getTracePropertiesStuff(trace.obj)
                } else {
                    if(!this.inputs.ctrlDown) {
                        if(pathInProgress.type == splitTime.trace.Type.PATH) {
                            if(closestPosition) {
                                pathInProgress.vertices = pathInProgress.vertices + " " + positionPoint
                            }
                        }
                        else {
                            pathInProgress.vertices = pathInProgress.vertices + " (close)"
                        }
                    }
                    this.levelEditorShared.pathInProgress = null
                }
                this.cancelNextContextMenu = true
            }
        } else if(this.levelEditorShared.mode === "position") {
            if(isRightClick) {
                this.createPosition()
                this.cancelNextContextMenu = true
            }
        } else if(this.levelEditorShared.mode === "prop") {
            if(isRightClick) {
                this.createProp()
                this.cancelNextContextMenu = true
            }
        }
    }

    function handleMouseMove(this: VueLevelGraphicalEditor, event: MouseEvent): void {
        const layerIndex = this.levelEditorShared.activeLayer
        const layer = this.level.layers[layerIndex]
        const layerZ = layer ? layer.obj.z : 0
        Vue.set(this.levelEditorShared.info, "x", this.inputs.mouse.x)
        Vue.set(this.levelEditorShared.info, "y", this.inputs.mouse.y + layerZ)
        Vue.set(this.levelEditorShared.info, "z", layerZ)
    }

    Vue.component("level-graphical-editor", {
        props: {
            editorInputs: Object,
            levelEditorShared: Object
        },
        data: function() {
            return {
                pathInProgress: null,
                cancelNextContextMenu: false
            }
        },
        computed: {
            level,
            inputs,
            position,
            containerWidth,
            containerHeight,
            leftPadding,
            topPadding
        },
        asyncComputed: {
            backgroundSrc
        },
        methods: {
            createPosition,
            createProp,
            handleContextMenu,
            handleMouseUp,
            handleMouseMove
        },
        template: `
<div
    class="level-area"
    v-on:dragstart.prevent
    v-on:dblclick.prevent
    v-on:mousemove="handleMouseMove"
    :style="{ position: 'relative', width: containerWidth + 'px', height: containerHeight + 'px', overflow: 'hidden' }"
>
    <img v-if="!!backgroundSrc" class="background" :src="backgroundSrc" :style="{ left: leftPadding + 'px', top: topPadding + 'px' }"/>
    <rendered-layer
            v-for="(layer, layerIndex) in level.layers"
            :key="layer.metadata.editorId"
            :level-editor-shared="levelEditorShared"
            :level="level"
            :layer="layer"
            :index="layerIndex"
            :width="level.width"
            :height="level.height"
            :is-active="layerIndex === levelEditorShared.activeLayer"
    ></rendered-layer>
</div>
        `,
    })
}