namespace splitTime.editor.level {
    export let projectName = ""
    export let projectPath = ""

    class GlobalEditorStuff implements GlobalEditorShared {
        followers: Followable[] | null = null
        previousFollowers: Followable[] | null = null
        
        setFollowers(newFollowers: Followable[]): void {
            this.previousFollowers = this.followers
            this.followers = newFollowers
        }
    }
    
    interface VueEditor extends VueComponent {
        // data
        inputs: UserInputs
        level: Level | null
        globalEditorStuff: GlobalEditorStuff
        supervisorControl: EditorSupervisorControl
        // methods
        createLevel(): void
        clickFileChooser(): void
        downloadLevel(): void
        editLevelSettings(): void
        moveFollowers(dx: number, dy: number, fallbackToPrevious?: boolean): void
        handleMouseMove(event: MouseEvent): void
        handleMouseDown(event: MouseEvent): void
        handleMouseUp(event: MouseEvent): void
        handleKeyDown(event: KeyboardEvent): void
        handleKeyUp(event: KeyboardEvent): void
        handleFileChange(event: Event): void
    }

    function createLevel(this: VueEditor) {
        if(this.level && this.level.layers.length > 0) {
            if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
                return
            }
        }

        this.level = new Level()
        this.level.layers.push(withMetadata("layer", {
            id: "",
            z: 0
        }))
        updatePageTitle(this.level)
    }

    function clickFileChooser(this: VueEditor) {
        this.$refs.fileInput.click()
    }

    function downloadLevel(this: VueEditor): void {
        if (this.level === null) {
            return
        }

        this.level.fileName = prompt("File name?", this.level.fileName) || ""
        if(!this.level.fileName) {
            return
        }
        if(!this.level.fileName.endsWith(".json")) {
            this.level.fileName += ".json"
        }

        var jsonText = exportLevel(this.level)

        updatePageTitle(this.level)
        downloadFile(this.level.fileName, jsonText)
    }

    function editLevelSettings(this: VueEditor): void {
        if (!this.level) {
            return
        }
        this.supervisorControl.triggerSettings()
    }

    function moveFollowers(this: VueEditor, dx: number, dy: number, fallbackToPrevious: boolean = true): void {
        let toMove = this.globalEditorStuff.followers
        if (fallbackToPrevious && toMove === null) {
            toMove = this.globalEditorStuff.previousFollowers
        }
        if (toMove === null) {
            toMove = []
        }
        for (const t of toMove) {
            t.shift(dx, dy)
        }
    }

    function handleMouseMove(this: VueEditor, event: MouseEvent): void {
        const oldX = this.inputs.mouse.x
        const oldY = this.inputs.mouse.y
        this.inputs.mouse.x = event.pageX
        this.inputs.mouse.y = event.pageY
        const dx = this.inputs.mouse.x - oldX
        const dy = this.inputs.mouse.y - oldY
        this.moveFollowers(dx, dy, false)
        // TODO: prevent default?
    }

    function handleMouseDown(this: VueEditor, event: MouseEvent): void {
        this.inputs.mouse.isDown = true
    }

    function handleMouseUp(this: VueEditor, event: MouseEvent): void {
        this.inputs.mouse.isDown = false
        this.globalEditorStuff.previousFollowers = this.globalEditorStuff.followers
        this.globalEditorStuff.followers = null
    }

    function handleKeyDown(this: VueEditor, event: KeyboardEvent): void {
        // TODO: resolve types
        const element = event.target as any
        switch (element.tagName.toLowerCase()) {
            case "input":
            case "textarea":
            return
        }
        
        const keycode = splitTime.controls.keyboard.keycode
        var specialKey = true
        switch(event.which) {
            case keycode.SHIFT:
                this.inputs.ctrlDown = true
                break
            case keycode.LEFT:
                this.moveFollowers(-1, 0)
                break
            case keycode.UP:
                this.moveFollowers(0, -1)
                break
            case keycode.RIGHT:
                this.moveFollowers(1, 0)
                break
            case keycode.DOWN:
                this.moveFollowers(0, 1)
                break
            default:
                specialKey = false
        }
        
        if(specialKey) {
            event.preventDefault()
        }
    }

    function handleKeyUp(this: VueEditor, event: KeyboardEvent): void {
        const keycode = splitTime.controls.keyboard.keycode
        if(event.which == keycode.SHIFT) { // shift
            this.inputs.ctrlDown = false
        } else if(event.which == keycode.ESC) { // esc
            if (this.level === null) {
                log.debug("No level to export")
            } else {
                log.debug("export of level JSON:")
                log.debug(exportLevel(this.level))
            }
        }
    }

    function handleFileChange(this: VueEditor, event: Event): void {
        assert(event.target !== null, "File change event has null target?")
        const inputElement = event.target as HTMLInputElement
        const fileList = inputElement.files
        assert(fileList !== null, "No files")
        const f = fileList[0]
        if (f) {
            var r = new FileReader()
            r.onload = e => {
                if (!e.target) {
                    throw new Error("No target?")
                }
                var contents = e.target.result
                if (typeof contents !== "string") {
                    throw new Error("Contents not string?")
                }
                this.level = importLevel(contents)
                this.level.fileName = f.name
                updatePageTitle(this.level)
            }
            r.readAsText(f)
        } else {
            alert("Failed to load file")
        }
    }

    Vue.component("st-editor", {
        data: function (){
            return {
                inputs: {
                    mouse: {
                        x: 0,
                        y: 0,
                        isDown: false
                    },
                    ctrlDown: false
                },
                level: null,
                globalEditorStuff: new GlobalEditorStuff(),
                supervisorControl: {
                    triggerSettings: () => {}
                }
            }
        },
        methods: {
            createLevel,
            clickFileChooser,
            downloadLevel,
            editLevelSettings,
            moveFollowers,
            handleMouseMove,
            handleMouseDown,
            handleMouseUp,
            handleKeyDown,
            handleKeyUp,
            handleFileChange
        },
        template: `
<div
    v-on:mousemove="handleMouseMove"
    v-on:mousedown="handleMouseDown"
    v-on:mouseup="handleMouseUp"
    v-on:keydown="handleKeyDown"
    v-on:keyup="handleKeyUp"
    >
    <div id="navmenu">
        <ul>
            <li class="pointer"><a v-on:click="createLevel">New Level</a></li>
            <li class="pointer"><a v-on:click="clickFileChooser">Load Level</a>
                <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    style="display:none"
                    v-on:change="handleFileChange"
                />
            </li>
            <li class="pointer">
                <a
                    v-on:click="downloadLevel"
                    title="After downloading the level, relocate it to use it in the engine."
                >Download File (Save)</a>
            </li>
            <li class="pointer"><a v-on:click="editLevelSettings">Edit Settings</a></li>
        </ul>
    </div>
    <level-editor
        v-if="level"
        :editor-inputs="inputs"
        :editor-global-stuff="globalEditorStuff"
        :supervisor-control="supervisorControl"
        :level="level"
    ></level-editor>
</div>
        `
    })
}