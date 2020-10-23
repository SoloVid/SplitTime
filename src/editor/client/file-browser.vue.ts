namespace splitTime.editor.client {
    interface VueFileBrowser extends VueComponent {
        // props
        confirmActionText: string
        editorInputs: UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        initialDirectory: string
        initialFileName: string
        rootDirectory: string
        showTextBox: boolean
        title: string
        // data
        currentDirectory: string
        filesInDirectory: server.FileEntry[]
        isLoading: boolean
        selectedFileName: string
        stack: string[]
        // computed
        projectDirectory: string
        // methods
        backDirectory(): void
        changeDirectory(directoryFullPath: string, skipPushStack?: boolean): Promise<void>
        isDirectory(fileName: string): boolean
        onClickConfirm(): void
        onMouseDown(event: MouseEvent): void
        selectFile(fileName: string): void
    }

    function data(this: VueFileBrowser): Partial<VueFileBrowser> {
        const stack: string[] = []
        let hitRoot = false
        const initialDirectoryParts = this.initialDirectory.split("/").filter(p => p !== "")
        let soFar = ""
        for (const part of initialDirectoryParts) {
            if (!hitRoot) {
                if (soFar === this.rootDirectory) {
                    hitRoot = true
                }
            }
            if (hitRoot) {
                stack.push(soFar)
            }
            soFar = soFar + "/" + part
        }
        return {
            currentDirectory: this.initialDirectory || this.rootDirectory || "",
            filesInDirectory: [],
            isLoading: true,
            stack,
            selectedFileName: this.initialFileName || ""
        }
    }

    function projectDirectory(this: VueFileBrowser): string {
        return this.editorGlobalStuff.server.projectId
    }

    function backDirectory(this: VueFileBrowser): void {
        if (this.stack.length === 0) {
            throw new Error("Stack is empty")
        }
        this.changeDirectory(this.stack.pop() as string, true)
    }

    async function changeDirectory(this: VueFileBrowser, directoryFullPath: string, skipPushStack: boolean = false): Promise<void> {
        this.selectedFileName = ""
        this.isLoading = true
        const s = this.editorGlobalStuff.server
        const requestData = s.withProject({ directory: directoryFullPath })
        try {
            this.filesInDirectory = await s.api.projectFiles.directoryListing.fetch(requestData)
            this.filesInDirectory.sort((a, b) => {
                if (a.type === "directory" && b.type === "file") {
                    return -1
                }
                if (a.type === "file" && b.type === "directory") {
                    return 1
                }
                return a.name.localeCompare(b.name)
            })
            if (!skipPushStack) {
                this.stack.push(this.currentDirectory)
            }
            this.currentDirectory = directoryFullPath
        } finally {
            this.isLoading = false
        }
    }

    function isDirectory(this: VueFileBrowser, fileName: string): boolean {
        const matchingFiles = this.filesInDirectory.filter(f => f.name === fileName)
        if (matchingFiles.length === 0) {
            return false
        }
        const fileInfo = matchingFiles[0]
        return fileInfo.type === "directory"
    }

    function onClickConfirm(this: VueFileBrowser): void {
        this.selectFile(this.selectedFileName)
    }

    // Per https://stackoverflow.com/a/43321596/4639640
    function onMouseDown(this: VueFileBrowser, event: MouseEvent): void {
        // On double+ click
        if (event.detail > 1) {
            // We're trying to prevent double-click highlight
            event.preventDefault();
        }
    }

    function selectFile(this: VueFileBrowser, fileName: string): void {
        if (!fileName) {
            this.$emit("file-selected", "")
            return
        }

        const fileFullPath = this.currentDirectory + "/" + fileName
        if (this.isDirectory(fileName)) {
            this.changeDirectory(fileFullPath)
        } else {
            this.$emit("file-selected", fileFullPath)
        }
    }

    function onMounted(this: VueFileBrowser): void {
        this.changeDirectory(this.initialDirectory, true)
        // Reset this because changeDirectory() clears it
        this.selectedFileName = this.initialFileName
    }

    Vue.component("file-browser", {
        props: {
            confirmActionText: String,
            editorInputs: Object,
            editorGlobalStuff: Object,
            initialDirectory: String,
            initialFileName: String,
            rootDirectory: String,
            showTextBox: Boolean,
            title: String
        },
        data,
        computed: {
            projectDirectory
        },
        methods: {
            backDirectory,
            changeDirectory,
            isDirectory,
            onClickConfirm,
            onMouseDown,
            selectFile
        },
        filters: {
            date: function(ms: number) {
                const d = new Date(ms)
                return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes()
            },
            byteString: formatBytes
        },
        mounted: onMounted,
        template: `
<div>
    <!--<h4>{{ title }}</h4>-->
    <div style="border: 1px solid black; padding: 4px; margin-bottom: 5px;">
        <em>{{ projectDirectory }}<strong>{{ currentDirectory }}</strong></em>
    </div>
    <table class="row-simple">
        <thead>
            <tr>
                <th></th>
                <th>Name</th>
                <th>Date modified</th>
                <th style="text-align: right">Size</th>
            </tr>
        </thead>
        <tbody>
            <tr
                v-if="stack.length > 0"
                @dblclick.left.prevent="backDirectory"
                @mousedown="onMouseDown"
                class="pointer"
            >
                <td>
                    <i class="fas fa-fw fa-backward"></i>
                </td>
                <td><em>Back</em></td>
                <td></td>
                <td></td>
            </tr>
            <tr
                v-for="file in filesInDirectory"
                @click.left="selectedFileName = file.name"
                @dblclick.left.prevent="selectFile(file.name)"
                @mousedown="onMouseDown"
                :class="{ pointer: true, active: file.name === selectedFileName }"
            >
                <td>
                    <i v-if="file.type === 'file'" class="fas fa-fw fa-file"></i>
                    <i v-if="file.type === 'directory'" class="fas fa-fw fa-folder"></i>
                </td>
                <td>{{ file.name }}</td>
                <td>{{ file.timeModified | date }}</td>
                <td style="text-align: right">
                    <span v-show="file.type !== 'directory'">
                        {{ file.size | byteString }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
    <br/>
    <div style="display: flex; gap: 0.5rem;" v-if="showTextBox">
        <div>File&nbsp;Name:</div>
        <div style="flex-grow: 1">
            <input v-model="selectedFileName" class="block"/>
        </div>
    </div>
    <br/>
    <div class="right">
        <a class="btn" v-show="selectedFileName !== ''" @click="onClickConfirm">{{ confirmActionText }}</a>
        <a class="btn" @click="selectFile('')">Cancel</a>
    </div>
</div>
        `
    })
}