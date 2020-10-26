namespace splitTime.editor.level {
    interface VueLevelGraphicalEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        levelEditorShared: LevelEditorShared
        // data
        cancelNextContextMenu: boolean
        editorPadding: number
        sorter: EntitySortHelper
        // computed
        allEntitiesSorted: (Position | Prop)[]
        backgroundStyleObject: object
        level: Level
        inputs: client.UserInputs
        containerWidth: number
        containerHeight: number
        levelOffsetStyleObject: object
        tracesSorted: Trace[]
        traceTransform: string
        // asyncComputed
        backgroundSrc: string
        // methods
        createPosition(): void
        createProp(): void
        handleContextMenu(event: Event): void
        handleMouseUp(event: MouseEvent): void
        handleMouseMove(event: MouseEvent): void
    }

    function data(this: VueLevelGraphicalEditor): Partial<VueLevelGraphicalEditor> {
        return {
            cancelNextContextMenu: false,
            editorPadding: EDITOR_PADDING,
            sorter: new EntitySortHelper(this.levelEditorShared.level)
        }
    }

    function allEntitiesSorted(this: VueLevelGraphicalEditor): (Position | Prop)[] {
        return this.sorter.getSortedEntities()
    }

    function backgroundStyleObject(this: VueLevelGraphicalEditor): object {
        const leftPadding = EDITOR_PADDING + this.level.backgroundOffsetX
        const topPadding = EDITOR_PADDING + this.level.backgroundOffsetY
        return {
            position: 'absolute',
            left: leftPadding + 'px',
            top: topPadding + 'px'
        }
    }

    function level(this: VueLevelGraphicalEditor): Level {
        return this.levelEditorShared.level
    }

    function inputs(this: VueLevelGraphicalEditor): client.UserInputs {
        let position = {
            x: 0,
            y: 0
        }
        if (this.$el) {
            const $pos = $(this.$el).position()
            position = {
                x: $pos.left,
                y: $pos.top
            }
        }
        const mouse = {
            x: this.editorInputs.mouse.x - position.x - EDITOR_PADDING,
            y: this.editorInputs.mouse.y - position.y - EDITOR_PADDING,
            // FTODO: only is down when inside level editor
            isDown: this.editorInputs.mouse.isDown
        }
        return {
            mouse,
            ctrlDown: this.editorInputs.ctrlDown
        }
    }

    function containerWidth(this: VueLevelGraphicalEditor): number {
        return this.level.width + 2*EDITOR_PADDING
    }
    function containerHeight(this: VueLevelGraphicalEditor): number {
        var addedHeight = this.level.groups.length > 0 ? this.level.groups[this.level.groups.length - 1].obj.defaultZ : 0
        return this.level.height + 2*EDITOR_PADDING + addedHeight
    }

    function levelOffsetStyleObject(this: VueLevelGraphicalEditor): object {
        return {
            position: 'absolute',
            left: EDITOR_PADDING + 'px',
            top: EDITOR_PADDING + 'px'
        }
    }

    function tracesSorted(this: VueLevelGraphicalEditor): Trace[] {
        return this.level.traces.sort((a, b) => a.obj.z - b.obj.z)
    }

    function traceTransform(this: VueLevelGraphicalEditor): string {
        return "translate(" + EDITOR_PADDING + "," + EDITOR_PADDING + ")"
    }

    function backgroundSrc(this: VueLevelGraphicalEditor): PromiseLike<string> {
        return this.levelEditorShared.server.imgSrc(this.level.background)
    }

    function createPosition(this: VueLevelGraphicalEditor) {
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        var z = group.defaultZ
        var x = this.inputs.mouse.x
        var y = this.inputs.mouse.y + z

        var object = {
            id: "",
            group: group.id,
            collage: this.levelEditorShared.selectedCollage,
            montage: this.levelEditorShared.selectedMontage,
            x: x,
            y: y,
            z: z,
            dir: this.levelEditorShared.selectedMontageDirection
        }
        const newThing = client.withMetadata<"position", splitTime.level.file_data.Position>("position", object)
        this.level.positions.push(newThing)
        this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(newThing.obj)
    }
    
    function createProp(this: VueLevelGraphicalEditor) {
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        var z = group.defaultZ
        var x = this.inputs.mouse.x
        var y = this.inputs.mouse.y + z
        
        var object = {
            id: "",
            group: group.id,
            collage: this.levelEditorShared.selectedCollage,
            montage: this.levelEditorShared.selectedMontage,
            x: x,
            y: y,
            z: z,
            dir: this.levelEditorShared.selectedMontageDirection,
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
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        const z = group.defaultZ
        const yInGroup = this.inputs.mouse.y + z
        const x = this.inputs.mouse.x
        const isLeftClick = event.which === 1
        const isRightClick = event.which === 3
        if(this.levelEditorShared.mode === "trace") {
            var literalPoint = "(" +
                Math.floor(x) + ", " +
                Math.floor(yInGroup) + ")"
            var closestPosition = findClosestPosition(this.level, this.inputs.mouse.x, yInGroup)
            var positionPoint = closestPosition ? "(pos:" + closestPosition.obj.id + ")" : ""
            const pathInProgress = this.levelEditorShared.pathInProgress
            if(isLeftClick) {
                if(pathInProgress) {
                    if(this.levelEditorShared.selectedTraceType == "path" && this.inputs.ctrlDown) {
                        pathInProgress.vertices = pathInProgress.vertices + " " + positionPoint
                    } else {
                        pathInProgress.vertices = pathInProgress.vertices + " " + literalPoint
                    }
                }
            } else if(isRightClick) {
                if(!pathInProgress) {
                    var trace = addNewTrace(this.level, this.levelEditorShared.activeGroup, this.levelEditorShared.selectedTraceType)
                    
                    if(this.levelEditorShared.selectedTraceType == splitTime.trace.Type.PATH && !this.inputs.ctrlDown) {
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
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        const groupZ = group ? group.defaultZ : 0
        Vue.set(this.levelEditorShared.info, "x", this.inputs.mouse.x)
        Vue.set(this.levelEditorShared.info, "y", this.inputs.mouse.y + groupZ)
        Vue.set(this.levelEditorShared.info, "z", groupZ)
    }

    Vue.component("level-graphical-editor", {
        props: {
            editorInputs: Object,
            levelEditorShared: Object
        },
        data,
        computed: {
            allEntitiesSorted,
            backgroundStyleObject,
            level,
            inputs,
            containerWidth,
            containerHeight,
            levelOffsetStyleObject,
            tracesSorted,
            traceTransform
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
    :style="{ position: 'relative', width: containerWidth + 'px', height: containerHeight + 'px', overflow: 'hidden' }"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @contextmenu.prevent
    @dblclick.prevent
    @dragstart.prevent
>
    <img v-if="!!backgroundSrc" class="background" :src="backgroundSrc" :style="backgroundStyleObject"/>
    
    <div
        v-for="entity in allEntitiesSorted"
        :key="entity.metadata.editorId"
        class="proposition-container"
        :style="levelOffsetStyleObject"
    >
        <rendered-proposition
            class="entity.type"
            :level-editor-shared="levelEditorShared"
            :p="entity"
        ></rendered-proposition>
    </div>
    <svg
        :style="{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', 'pointer-events': 'none' }"
        class="trace-svg"
    >
        <rendered-trace v-for="trace in tracesSorted"
            :key="trace.metadata.editorId"
            :transform="traceTransform"
            :level-editor-shared="levelEditorShared"
            :metadata="trace.metadata"
            :trace="trace.obj"
        ></rendered-trace>
    </svg>

    <grid-lines
        v-if="levelEditorShared.gridEnabled"
        :grid-cell="levelEditorShared.gridCell"
        :origin="{x: editorPadding, y: editorPadding}"
    ></grid-lines>
</div>
        `,
    })
}