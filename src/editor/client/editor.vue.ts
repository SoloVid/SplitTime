namespace splitTime.editor {
    class GlobalEditorStuff implements client.GlobalEditorShared {
        followers: client.Followable[] | null = null
        previousFollowers: client.Followable[] | null = null

        constructor(
            private readonly editor: VueEditor
        ) {}

        get server(): client.ServerLiaison {
            return this.editor.server
        }

        get time(): game_seconds {
            return this.editor.time
        }
        
        setFollowers(newFollowers: client.Followable[]): void {
            this.previousFollowers = this.followers
            this.followers = newFollowers
        }
    }
    
    interface VueEditor extends client.VueComponent {
        // props
        server: client.ServerLiaison
        time: game_seconds
        // data
        fileBrowserStartPath: string
        showFileSelect: boolean
        inputs: client.UserInputs
        collage: file.Collage | null
        level: editor.level.Level | null
        globalEditorStuff: GlobalEditorStuff
        supervisorControl: client.EditorSupervisorControl
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
        onServerFileSelected(filePath: string): void
        openFileSelect(): void
    }

    function data(this: VueEditor): Partial<VueEditor> {
        return {
            fileBrowserStartPath: "",
            showFileSelect: false,
            inputs: {
                mouse: {
                    x: 0,
                    y: 0,
                    isDown: false
                },
                ctrlDown: false
            },
            collage: null,
            level: null,
            globalEditorStuff: new GlobalEditorStuff(this),
            supervisorControl: {
                triggerSettings: () => {}
            }
        }
    }

    function createLevel(this: VueEditor) {
        if(this.level && this.level.layers.length > 0) {
            if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
                return
            }
        }

        this.level = new level.Level()
        this.level.layers.push(level.withMetadata("layer", {
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

        var jsonText = level.exportLevelJson(this.level)

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
                log.debug(level.exportLevel(this.level))
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
                this.level = level.importLevel(contents)
                this.level.fileName = f.name
                updatePageTitle(this.level)
            }
            r.readAsText(f)
        } else {
            alert("Failed to load file")
        }
    }

    async function onServerFileSelected(this: VueEditor, filePath: string): Promise<void> {
        this.showFileSelect = false
        log.debug("File selected: " + filePath)
        if (!filePath) {
            log.debug("Canceled.")
            return
        }
        const response = await this.server.api.projectFiles.readFile.fetch(
            this.server.withProject({ filePath }))
        const contents = atob(response.base64Contents)
        const fileObject = JSON.parse(contents)
        log.debug(fileObject)
        if (splitTime.level.instanceOf.FileData(fileObject)) {
            this.level = level.importLevel(contents)
            this.level.fileName = filePath
            updatePageTitle(this.level)
        } else if (splitTime.file.instanceOf.Collage(fileObject)) {
            this.collage = fileObject
            log.debug(fileObject)
            log.debug(splitTime.collage.makeCollageFromFile(fileObject))
        } else {
            alert("Editing this file type is not supported. Is it possible your data is corrupted?")
        }
    }

    function openFileSelect(this: VueEditor): void {
        this.fileBrowserStartPath = ""
        this.showFileSelect = true
    }

    Vue.component("st-editor", {
        props: {
            server: Object,
            time: Number
        },
        data,
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
            handleFileChange,
            onServerFileSelected,
            openFileSelect
        },
        template: `
<div
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    >
    <div class="menu-bar">
        <a @click="createLevel">New Level</a>
        <a @click="openFileSelect">Open</a>
        <a
            @click="downloadLevel"
            title="After downloading the level, relocate it to use it in the engine."
        >Download File (Save)</a>
        <a @click="editLevelSettings">Edit Settings</a>
    </div>
    <div class="modal-backdrop" v-if="showFileSelect">
        <div class="modal-body">
            <file-browser
                :editor-inputs="inputs"
                :editor-global-stuff="globalEditorStuff"
                :request-directory="fileBrowserStartPath"
                @file-selected="onServerFileSelected"
            ></file-browser>
        </div>
    </div>
    <collage-editor
        v-if="collage"
        :editor-inputs="inputs"
        :editor-global-stuff="globalEditorStuff"
        :supervisor-control="supervisorControl"
        :collage="collage"
    ></collage-editor>
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