namespace splitTime.editor.level {
    interface VueLevelGraphicalEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        levelEditorShared: LevelEditorShared
        // data
        cancelNextContextMenu: boolean
        editorPadding: number
        // computed
        allEntitiesSorted: (Position | Prop | Trace)[]
        backgroundSrc: string
        backgroundStyleObject: object
        level: Level
        inputs: client.UserInputs
        containerWidth: number
        containerHeight: number
        levelOffsetStyleObject: object
        sorter: EntitySortHelper
        traceTransform: string
        // asyncComputed
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
            editorPadding: EDITOR_PADDING
        }
    }

    function allEntitiesSorted(this: VueLevelGraphicalEditor): (Position | Prop | Trace)[] {
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

    function sorter(this: VueLevelGraphicalEditor): EntitySortHelper {
        const bodyManager = new EntityBodyManager(this.levelEditorShared.level, this.levelEditorShared.collageManager)
        return new EntitySortHelper(this.levelEditorShared.level, bodyManager)
    }

    function traceTransform(this: VueLevelGraphicalEditor): string {
        return "translate(" + EDITOR_PADDING + "," + EDITOR_PADDING + ")"
    }

    function backgroundSrc(this: VueLevelGraphicalEditor): string {
        return this.levelEditorShared.server.imgSrc(this.level.background)
    }

    function getBestEntityLocation(editor: VueLevelGraphicalEditor): Coordinates3D {
        const group = getGroupByIndex(editor.level, editor.levelEditorShared.activeGroup)
        var z = group.defaultZ
        var x = editor.inputs.mouse.x
        var y = editor.inputs.mouse.y + z
        
        const m = editor.levelEditorShared.selectedMontageObject
        if (!m) {
            return new Coordinates3D(x, y, z)
        }
        const LARGE_NUMBER = 999
        const start = new Coordinates2D(-LARGE_NUMBER, -LARGE_NUMBER)
        const dx = x - start.x
        const dy = y - start.y
        const snappedMover = createSnapMontageMover(editor.levelEditorShared.gridCell, m.body, start)
        snappedMover.applyDelta(dx, dy)
        const snapped = snappedMover.getSnappedDelta()
        snapped.x += start.x
        snapped.y += start.y
        return new Coordinates3D(snapped.x, snapped.y, z)
    }

    function createPosition(this: VueLevelGraphicalEditor) {
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        const loc = getBestEntityLocation(this)

        let pIndex = this.level.positions.length
        let pId = "Position " + pIndex
        while (this.level.positions.some(m => m.obj.id === pId)) {
            pIndex++
            pId = "Position " + pIndex
        }
        var object = {
            id: pId,
            group: group.id,
            collage: this.levelEditorShared.selectedCollage,
            montage: this.levelEditorShared.selectedMontage,
            x: loc.x,
            y: loc.y,
            z: loc.z,
            dir: this.levelEditorShared.selectedMontageDirection
        }
        const newThing = client.withMetadata<"position", splitTime.level.file_data.Position>("position", object)
        this.level.positions.push(newThing)
        this.levelEditorShared.editProperties(getPositionPropertiesStuff(this.level, newThing.obj))
    }
    
    function createProp(this: VueLevelGraphicalEditor) {
        const group = getGroupByIndex(this.level, this.levelEditorShared.activeGroup)
        const loc = getBestEntityLocation(this)
        
        var object = {
            id: "",
            group: group.id,
            collage: this.levelEditorShared.selectedCollage,
            montage: this.levelEditorShared.selectedMontage,
            x: loc.x,
            y: loc.y,
            z: loc.z,
            dir: this.levelEditorShared.selectedMontageDirection,
            playerOcclusionFadeFactor: 0
        }

        const newThing = client.withMetadata<"prop", splitTime.level.file_data.Prop>("prop", object)
        this.level.props.push(newThing)
        this.levelEditorShared.editProperties(getPropPropertiesStuff(this.level, newThing.obj))
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
            const snappedX = Math.round(x / this.levelEditorShared.gridCell.x) * this.levelEditorShared.gridCell.x
            const snappedY = Math.round(yInGroup / this.levelEditorShared.gridCell.y) * this.levelEditorShared.gridCell.y
            var literalPoint = "(" +
                Math.floor(snappedX) + ", " +
                Math.floor(snappedY) + ")"
            var closestPosition = findClosestPosition(this.level, this.inputs.mouse.x, yInGroup)
            var positionPoint = closestPosition ? splitTime.trace.makePositionPoint(closestPosition.obj.id) : ""
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
                    this.levelEditorShared.editProperties(getTracePropertiesStuff(this.level, trace.obj))
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
            backgroundSrc,
            backgroundStyleObject,
            level,
            inputs,
            containerWidth,
            containerHeight,
            levelOffsetStyleObject,
            sorter,
            traceTransform
        },
        asyncComputed: {
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
        class="entity"
    >
        <div
            v-if="entity.type === 'prop' || entity.type === 'position'"
            class="proposition-container"
            :style="levelOffsetStyleObject"
        >
            <rendered-proposition
                :class="entity.type"
                :level-editor-shared="levelEditorShared"
                :p="entity"
            ></rendered-proposition>
        </div>
        <svg
            v-if="entity.type === 'trace'"
            :style="{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', 'pointer-events': 'none' }"
            class="trace-svg"
        >
            <rendered-trace
                :transform="traceTransform"
                :level-editor-shared="levelEditorShared"
                :metadata="entity.metadata"
                :trace="entity.obj"
            ></rendered-trace>
        </svg>
    </div>

    <grid-lines
        v-if="levelEditorShared.gridEnabled"
        :grid-cell="levelEditorShared.gridCell"
        :origin="{x: editorPadding, y: editorPadding}"
    ></grid-lines>
</div>
        `,
    })
}