namespace splitTime.editor.level {
    class SharedStuff implements LevelEditorShared {
        constructor(
            private editor: VueLevelEditor
        ) {}

        getLevel(): Level {
            return this.editor.level
        }

        shouldDragBePrevented(): boolean {
            return this.editor.inputs.mouse.isDown || this.editor.pathInProgress !== null
        }

        follow(follower: Followable): void {
            this.editor.editorGlobalStuff.setFollowers([follower])
        }
    }

    export interface VueLevelEditor extends VueComponent {
        editorInputs: UserInputs
        editorGlobalStuff: GlobalEditorShared
        level: Level
        activeLayer: number
        mode: Mode
        typeSelected: string
        sharedStuff: LevelEditorShared
        pathInProgress: splitTime.level.file_data.Trace | null
        cancelNextContextMenu: boolean
        traceOptions: {
            type: string,
            color: string,
            help: string
        }[]
        info: { [name: string]: string | number }
        inputs: UserInputs
        position: Coordinates2D
        backgroundSrc: string
        containerWidth: number
        containerHeight: number
        leftPadding: number
        topPadding: number
        selectModeOption(mode: Mode): void
        selectTraceOption(type: string): void
        createLayer(): void
        createPosition(): void
        createProp(): void
        handleContextMenu(event: Event): void
        handleMouseUp(event: MouseEvent): void
    }

    function info(this: VueLevelEditor): { [name: string]: string | number } {
        const layerIndex = this.activeLayer;
        const layer = this.level.layers[layerIndex];
        const layerZ = layer ? layer.obj.z : 0
        return {
            "x": this.inputs.mouse.x,
            "y": this.inputs.mouse.y + layerZ,
            "z": layerZ
        }
    }

    function inputs(this: VueLevelEditor): UserInputs {
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

    function position(this: VueLevelEditor): Coordinates2D {
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

    function backgroundSrc(this: VueLevelEditor): string {
        return imgSrc(this.level.background);
    }
    function containerWidth(this: VueLevelEditor): number {
        return this.level.width + 2*EDITOR_PADDING;
    }
    function containerHeight(this: VueLevelEditor): number {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].obj.z : 0;
        return this.level.height + 2*EDITOR_PADDING + addedHeight;
    }
    function leftPadding(this: VueLevelEditor): number {
        return EDITOR_PADDING + this.level.backgroundOffsetX;
    }
    function topPadding(this: VueLevelEditor): number {
        return EDITOR_PADDING + this.level.backgroundOffsetY;
    }

    function selectModeOption(this: VueLevelEditor, mode: Mode): void {
        this.mode = mode
        this.pathInProgress = null
    }
    function selectTraceOption(this: VueLevelEditor, type: string): void {
        this.typeSelected = type
        this.selectModeOption("trace")
    }

    function createLayer(this: VueLevelEditor): void {
        var assumedRelativeZ = DEFAULT_HEIGHT;
        if(this.level.layers.length > 1) {
            assumedRelativeZ = Math.abs(this.level.layers[1].obj.z - this.level.layers[0].obj.z);
        }
        var z = 0;
        if(this.level.layers.length > 0) {
            var previousLayer = this.level.layers[this.level.layers.length - 1];
            z = previousLayer.obj.z + assumedRelativeZ;
        }
        this.level.layers.push(withMetadata("layer", {
            id: "",
            z: z
        }))
    }

    function createPosition(this: VueLevelEditor) {
        var layerIndex = this.activeLayer;
        var z = this.level.layers[layerIndex].obj.z;
        var x = this.inputs.mouse.x;
        var y = this.inputs.mouse.y + z;
        
        var object = {
            id: "",
            template: "",
            x: x,
            y: y,
            z: z,
            dir: "S",
            stance: "default"
        }
        const newThing = withMetadata<"position", splitTime.level.file_data.Position>("position", object)
        this.level.positions.push(newThing);
        showEditorPosition(newThing);
    }
    
    function createProp(this: VueLevelEditor) {
        var layerIndex = this.activeLayer;
        var z = this.level.layers[layerIndex].obj.z;
        var x = this.inputs.mouse.x;
        var y = this.inputs.mouse.y + z;
        
        var object = {
            id: "",
            template: "",
            x: x,
            y: y,
            z: z,
            dir: "S",
            stance: "default",
            playerOcclusionFadeFactor: 0
        }

        const newThing = withMetadata<"prop", splitTime.level.file_data.Prop>("prop", object)
        this.level.props.push(newThing);
        showEditorProp(newThing);
    }

    function handleContextMenu(this: VueLevelEditor, event: Event): void {
        if(this.cancelNextContextMenu) {
            event.preventDefault();
        }
        this.cancelNextContextMenu = false;
    }

    function handleMouseUp(this: VueLevelEditor, event: MouseEvent): void {
        const z = this.level.layers[this.activeLayer].obj.z;
        const yOnLayer = this.inputs.mouse.y + z;
        const x = this.inputs.mouse.x
        const isLeftClick = event.which === 1
        const isRightClick = event.which === 3
        if(this.mode === "trace") {
            var literalPoint = "(" +
                Math.floor(x) + ", " +
                Math.floor(yOnLayer) + ")"
            var closestPosition = findClosestPosition(this.level, this.inputs.mouse.x, yOnLayer);
            var positionPoint = closestPosition ? "(pos:" + closestPosition.obj.id + ")" : "";
            if(isLeftClick) {
                if(this.pathInProgress) {
                    if(this.typeSelected == "path" && this.inputs.ctrlDown) {
                        this.pathInProgress.vertices = this.pathInProgress.vertices + " " + positionPoint;
                    } else {
                        this.pathInProgress.vertices = this.pathInProgress.vertices + " " + literalPoint;
                    }
                }
            } else if(isRightClick) {
                if(!this.pathInProgress) {
                    var trace = addNewTrace(this.level, this.activeLayer, this.typeSelected);
                    
                    if(this.typeSelected == splitTime.trace.Type.PATH && !this.inputs.ctrlDown) {
                        trace.vertices = positionPoint;
                    } else {
                        trace.vertices = literalPoint;
                    }
                    
                    this.pathInProgress = trace;
                } else {
                    if(!this.inputs.ctrlDown) {
                        if(this.pathInProgress.type == splitTime.trace.Type.PATH) {
                            if(closestPosition) {
                                this.pathInProgress.vertices = this.pathInProgress.vertices + " " + positionPoint;
                            }
                        }
                        else {
                            this.pathInProgress.vertices = this.pathInProgress.vertices + " (close)";
                        }
                    }
                    this.pathInProgress = null;
                }
                this.cancelNextContextMenu = true;
            }
        } else if(this.mode === "position") {
            if(isRightClick) {
                this.createPosition()
                this.cancelNextContextMenu = true
            }
        } else if(this.mode === "prop") {
            if(isRightClick) {
                this.createProp()
                this.cancelNextContextMenu = true
            }
        }
    }

    defer(() => {
        Vue.component("level-editor", {
            props: {
                editorInputs: Object,
                editorGlobalStuff: Object,
                level: Object
            },
            template: `
<div>
    <div id="editorTools">
        <div
            id="layers"
            v-on:dragstart.prevent
            v-on:dblclick.prevent
            v-bind:style="{ width: containerWidth + 'px', height: containerHeight + 'px', overflow: 'hidden' }"
        >
            <img v-if="!!backgroundSrc" class="background" v-bind:src="backgroundSrc" v-bind:style="{ left: leftPadding + 'px', top: topPadding + 'px' }"/>
            <rendered-layer
                    v-for="(layer, layerIndex) in level.layers"
                    :key="layerIndex"
                    :level-editor-shared="sharedStuff"
                    :level="level"
                    :layer="layer"
                    :index="layerIndex"
                    :width="level.width"
                    :height="level.height"
                    :is-active="layerIndex === activeLayer"
            ></rendered-layer>
        </div>

        <div class="menu" style="left:0px;width:100px">
            Tools:
            <div class="option"
                v-on:click="selectModeOption('position')"
                title="Positions are handles for locations that Actors may occupy or paths may lead to and from.&#013;&#013;NPCs are generally people or things that have dynamic properties.&#013;NPCs are loaded at game start and transcend the board (i.e. they are not actually tied to the board and may be moved to other boards).
                &#013;Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone.&#013;Double-click to open properties."
                >Position</div>
            <div class="option"
                v-on:click="selectModeOption('prop')"
                title="Props are loaded on level entrance and are destroyed on level exit. They are used in few processes, and slow down performance less than NPCs&#013;Props are generally static (or animated) graphical elements Bodys can walk behind or in front of.
                &#013;Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone&#013;Double-click to open properties."
                >Prop</div>
            <br>
            Active Layer:
            <select id="activeLayer" v-model="activeLayer">
                <option v-for="(layer, index) in level.layers" v-bind:value="index">{{ layer.id || ("Layer " + index) }}</option>
            </select>
            <br><br>
            <div id="traceOptions">
                <span title="Traces define Bodys' (actually just NPCs and players) interaction with the level.&#013;
                    &#013;Right-click to create new.&#013;Left-click to add points to started trace.&#013;Right-click to close trace (and fill in), or shift+right-click to end trace without filling in.&#013;Left-click to drag.&#013;Shift+left-click to clone.&#013;Double-click to open properties.">Traces</span>
                <div v-for="(traceOption) in traceOptions"
                    v-bind:key="traceOption.type"
                    class="option"
                    v-bind:style="{ color: 'white', backgroundColor: traceOption.color }"
                    v-on:click="selectTraceOption(traceOption.type)"
                    v-bind:title="traceOption.help"
                >
                    {{ traceOption.type }}
                </div>
            </div>
        </div>
        <div id="layerMenuVue" class="menu" style="right:0px;">
            <div>
                <menu-layer
                        v-for="(layer, index) in level.layers"
                        v-bind:key="index"
                        v-bind:level="level"
                        v-bind:layer="layer"
                        v-bind:index="index"
                ></menu-layer>
            </div>
            <div class="option" v-on:click.left="createLayer">Add Layer</div>
        </div>
    </div>

    <div id="XMLEditorBack" class="backdrop">
        <div id="XMLEditor">
            <div id="XMLEditorFields"></div>
            <button id="saveChanges" style="right:0;">Save Changes</button>
            <button id="deleteThing">Delete This</button>
        </div>
    </div>

    <svg
        style="position: absolute; pointer-events: none;"
    >
        <defs>
            <pattern id="up-arrows-pattern" x="0" y="0" width="20" height="25" patternUnits="userSpaceOnUse">
                <polyline
                    points="5,8 10,0 10,20 10,0 15,8"
                    stroke="rgba(0, 0, 0, 0.7)" stroke-width="1.5" fill="none"
                ></polyline>
            </pattern>
        </defs>
    </svg>

    <div id="infoPane" class="menu" style="left: 0; top: auto; bottom: 0; width: auto;">
        <span v-for="(value, name) in info" v-bind:key="name">
            {{ name }}: {{ value }}
        </span>
    </div>
</div>
            `,
            data: function() {
                return {
                    activeLayer: 0,
                    mode: "position",
                    typeSelected: trace.Type.SOLID,
                    sharedStuff: new SharedStuff(this as VueLevelEditor),
                    pathInProgress: null,
                    cancelNextContextMenu: false,
                    traceOptions
                }
            },
            computed: {
                info,
                inputs,
                position,
                backgroundSrc,
                containerWidth,
                containerHeight,
                leftPadding,
                topPadding
            },
            methods: {
                selectModeOption,
                selectTraceOption,
                createLayer,
                createPosition,
                createProp,
                handleContextMenu,
                handleMouseUp
            }
        });
    })
}