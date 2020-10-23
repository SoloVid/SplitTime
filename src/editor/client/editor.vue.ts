namespace splitTime.editor {
    class GlobalEditorStuff implements client.GlobalEditorShared {
        gridEnabled = false
        cachedGridCell = new Vector2D(32, 32)
        followers: client.Followable[] | null = null
        previousFollowers: client.Followable[] | null = null
        onDeleteCallback = () => {}

        constructor(
            private readonly editor: VueEditor
        ) {}

        get gridCell(): Vector2D {
            if (!this.gridEnabled) {
                return new Vector2D(1, 1)
            }
            return this.cachedGridCell
        }

        get server(): client.ServerLiaison {
            return this.editor.server
        }

        get time(): game_seconds {
            return this.editor.time
        }

        openFileSelect(rootDirectory: string): PromiseLike<string> {
            const pledge = new Pledge()
            this.editor.openFileSelect(rootDirectory, filePath => pledge.resolve(filePath))
            return pledge
        }
        
        setFollowers(newFollowers: client.Followable[]): void {
            this.previousFollowers = this.followers
            this.followers = newFollowers
        }

        setOnDelete(callback: () => void): void {
            this.onDeleteCallback = callback
        }
    }
    
    type FileBrowserReturnListener = (filePath: string) => void
    interface VueEditor extends client.VueComponent {
        // props
        server: client.ServerLiaison
        time: game_seconds
        // data
        fileBrowserConfirmActionText: string
        fileBrowserReturnListener: (FileBrowserReturnListener) | null
        fileBrowserRoot: string
        fileBrowserShowTextBox: boolean
        fileBrowserStartDirectory: string
        fileBrowserStartFileName: string
        fileBrowserTitle: string
        lastServerFile: string | null
        showFileBrowser: boolean
        showNewDialog: boolean 
        inputs: client.UserInputs
        collage: file.Collage | null
        level: editor.level.Level | null
        globalEditorStuff: GlobalEditorStuff
        supervisorControl: client.EditorSupervisorControl
        // methods
        createCollage(): void
        createLevel(): void
        editSettings(): void
        moveFollowers(dx: number, dy: number, fallbackToPrevious?: boolean): void
        handleMouseMove(event: MouseEvent): void
        handleMouseDown(event: MouseEvent): void
        handleMouseUp(event: MouseEvent): void
        handleKeyDown(event: KeyboardEvent): void
        handleKeyUp(event: KeyboardEvent): void
        handleFileChange(event: Event): void
        onServerFileSelected(filePath: string): void
        openFileOpen(): void
        openFileSave(): void
        openFileSelect(rootDirectory: string, callback: FileBrowserReturnListener): void
    }

    function data(this: VueEditor): Partial<VueEditor> {
        return {
            fileBrowserConfirmActionText: "Select",
            fileBrowserReturnListener: null,
            fileBrowserRoot: "",
            fileBrowserShowTextBox: false,
            fileBrowserStartDirectory: "",
            fileBrowserStartFileName: "",
            fileBrowserTitle: "Select File",
            lastServerFile: null,
            showFileBrowser: false,
            showNewDialog: false,
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

    function createCollage(this: VueEditor) {
        this.showNewDialog = false
        if(this.collage) {
            if(!confirm("Are you sure you want to clear the current collage and create a new one?")) {
                return
            }
        }

        this.collage = {
            image: "",
            frames: [],
            montages: [],
            defaultMontageId: ""
        }

        updatePageTitle("collage untitled")
    }

    function createLevel(this: VueEditor) {
        this.showNewDialog = false
        if(this.level && this.level.layers.length > 0) {
            if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
                return
            }
        }

        this.level = new level.Level()
        this.level.layers.push(client.withMetadata("layer", {
            id: "",
            z: 0
        }))
        updatePageTitle("level untitled")
    }

    function clickFileChooser(this: VueEditor) {
        this.$refs.fileInput.click()
    }

    function editSettings(this: VueEditor): void {
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
        if (this.globalEditorStuff.followers !== null) {
            this.globalEditorStuff.previousFollowers = this.globalEditorStuff.followers
            this.globalEditorStuff.followers = null
        }
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
            case keycode.DEL:
                this.globalEditorStuff.onDeleteCallback()
                break;
            case keycode.SHIFT:
                this.inputs.ctrlDown = true
                break
            case keycode.LEFT:
                this.moveFollowers(-this.globalEditorStuff.gridCell.x, 0)
                break
            case keycode.UP:
                this.moveFollowers(0, -this.globalEditorStuff.gridCell.y)
                break
            case keycode.RIGHT:
                this.moveFollowers(this.globalEditorStuff.gridCell.x, 0)
                break
            case keycode.DOWN:
                this.moveFollowers(0, this.globalEditorStuff.gridCell.y)
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

    async function onServerFileSelected(this: VueEditor, filePath: string): Promise<void> {
        this.showFileBrowser = false
        if (!filePath) {
            return
        }
        assert(this.fileBrowserReturnListener !== null, "Who is waiting for file browser?")
        this.fileBrowserReturnListener(filePath)
        this.fileBrowserReturnListener = null
    }

    function openFileOpen(this: VueEditor): void {
        this.fileBrowserReturnListener = async filePath => {
            this.lastServerFile = filePath
            const response = await this.server.api.projectFiles.readFile.fetch(
                this.server.withProject({ filePath }))
            const contents = atob(response.base64Contents)
            const fileObject = JSON.parse(contents)
            if (splitTime.level.instanceOf.FileData(fileObject)) {
                this.level = level.importLevel(contents)
                updatePageTitle(level.getLevelPageTitle(filePath, this.level))
            } else if (splitTime.file.instanceOf.Collage(fileObject)) {
                this.collage = fileObject
                updatePageTitle(filePath)
            } else {
                alert("Editing this file type is not supported. Is it possible your data is corrupted?")
            }
        }
        this.fileBrowserTitle = "Open File"
        this.fileBrowserConfirmActionText = "Open"
        this.fileBrowserRoot = ""
        this.fileBrowserStartDirectory = ""
        this.fileBrowserShowTextBox = false
        this.showFileBrowser = true
    }

    function openFileSave(this: VueEditor): void {
        let preloadDirectory = ""
        let preloadFileName = ""
        if (this.lastServerFile !== null) {
            const lastSlash = this.lastServerFile.lastIndexOf("/")
            preloadDirectory = this.lastServerFile.substring(0, lastSlash)
            preloadFileName = this.lastServerFile.substring(lastSlash + 1)
        }
        this.fileBrowserReturnListener = async filePath => {
            this.lastServerFile = filePath
            let fileContents: file.json
            if (this.level) {
                fileContents = level.exportLevelJson(this.level)
            } else if (this.collage) {
                fileContents = toJson(this.collage)
            } else {
                throw new Error("What are you trying to save?")
            }
            await this.server.api.projectFiles.writeFile.fetch(
                this.server.withProject({ filePath, base64Contents: btoa(fileContents) })
            )
        }
        this.fileBrowserTitle = "Save File As"
        this.fileBrowserConfirmActionText = "Save"
        this.fileBrowserRoot = ""
        this.fileBrowserStartDirectory = preloadDirectory
        this.fileBrowserShowTextBox = true
        this.fileBrowserStartFileName = preloadFileName
        this.showFileBrowser = true
    }

    function openFileSelect(this: VueEditor, rootDirectory: string, callback: FileBrowserReturnListener): void {
        this.fileBrowserReturnListener = callback
        this.fileBrowserTitle = "Select File"
        this.fileBrowserConfirmActionText = "Select"
        this.fileBrowserRoot = rootDirectory
        this.fileBrowserStartDirectory = rootDirectory
        this.fileBrowserShowTextBox = false
        this.showFileBrowser = true
    }

    function onMounted(this: VueEditor): void {
        window.addEventListener("keydown", e => {
            this.handleKeyDown(e)
        });
        window.addEventListener("keyup", e => {
            this.handleKeyUp(e)
        });
    }

    Vue.component("st-editor", {
        props: {
            server: Object,
            time: Number
        },
        data,
        methods: {
            createCollage,
            createLevel,
            clickFileChooser,
            editSettings,
            moveFollowers,
            handleMouseMove,
            handleMouseDown,
            handleMouseUp,
            handleKeyDown,
            handleKeyUp,
            onServerFileSelected,
            openFileOpen,
            openFileSave,
            openFileSelect
        },
        mounted: onMounted,
        template: `
<div
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    class="editor"
    style="display: flex; flex-flow: column; height: 100vh;"
>
    <div class="menu-bar">
        <a @click="showNewDialog = true">New</a>
        <a @click="openFileOpen">Open</a>
        <a @click="openFileSave">Save</a>
        <a @click="editSettings">Edit Settings</a>
        <label>
            Grid:
            <input type="checkbox" v-model="globalEditorStuff.gridEnabled"/>
        </label>
        <label v-if="globalEditorStuff.gridEnabled">
            x:
            <input type="number" v-model.number="globalEditorStuff.gridCell.x" style="width: 48px;"/>
        </label>
        <label v-if="globalEditorStuff.gridEnabled">
            y:
            <input type="number" v-model.number="globalEditorStuff.gridCell.y" style="width: 48px;"/>
        </label>
    </div>
    <div class="modal-backdrop" v-if="showNewDialog">
        <div class="modal-body">
            <p><strong>What do you want to create?</strong></p>
            <div>
                <a class="btn" @click="createLevel">New Level</a>
                <a class="btn" @click="createCollage">New Collage</a>
                <a class="btn" @click="showNewDialog = false">Cancel</a>
            </div>
        </div>
    </div>
    <div class="modal-backdrop" v-if="showFileBrowser">
        <div class="modal-body">
            <file-browser
                :confirm-action-text="fileBrowserConfirmActionText"
                :editor-inputs="inputs"
                :editor-global-stuff="globalEditorStuff"
                :initial-directory="fileBrowserStartDirectory"
                :initial-file-name="fileBrowserStartFileName"
                :root-directory="fileBrowserRoot"
                :show-text-box="fileBrowserShowTextBox"
                :title="fileBrowserTitle"
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
        style="flex-grow: 1; overflow: hidden;"
    ></collage-editor>
    <level-editor
        v-if="level"
        :editor-inputs="inputs"
        :editor-global-stuff="globalEditorStuff"
        :supervisor-control="supervisorControl"
        :level="level"
        style="flex-grow: 1; overflow: hidden;"
    ></level-editor>
</div>
        `
    })
}