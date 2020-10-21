namespace splitTime.editor.client {
    interface VueFileBrowser extends VueComponent {
        // props
        editorInputs: UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        requestDirectory: string
        // data
        currentDirectory: string
        filesInDirectory: server.FileEntry[]
        isLoading: boolean
        selectedFile: server.FileEntry | null
        stack: string[]
        // computed
        // methods
        backDirectory(): void
        changeDirectory(directoryFullPath: string, skipPushStack?: boolean): Promise<void>
        selectFile(file: server.FileEntry): void
    }

    function data(this: VueFileBrowser): Partial<VueFileBrowser> {
        return {
            currentDirectory: this.requestDirectory || "",
            filesInDirectory: [],
            isLoading: true,
            stack: [],
            selectedFile: null
        }
    }

    function backDirectory(this: VueFileBrowser): void {
        if (this.stack.length === 0) {
            throw new Error("Stack is empty")
        }
        this.changeDirectory(this.stack.pop() as string, true)
    }

    async function changeDirectory(this: VueFileBrowser, directoryFullPath: string, skipPushStack: boolean = false): Promise<void> {
        this.selectedFile = null
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

    function selectFile(this: VueFileBrowser, file: server.FileEntry | null): void {
        if (!file) {
            this.$emit("file-selected", "")
            return
        }

        const fileFullPath = file.parentPath + "/" + file.name
        if (file.type === "file") {
            // TODO: make it how I want it to be
            this.$emit("file-selected", fileFullPath)
            return
        }
        this.changeDirectory(fileFullPath)
    }

    function onMounted(this: VueFileBrowser): void {
        this.changeDirectory(this.requestDirectory, true)
    }

    Vue.component("file-browser", {
        props: {
            editorInputs: Object,
            editorGlobalStuff: Object,
            requestDirectory: String
        },
        data,
        computed: {
        },
        methods: {
            backDirectory,
            changeDirectory,
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
                @click.left="selectedFile = file"
                @dblclick.left.prevent="selectFile(file)"
                :class="{ pointer: true, active: file === selectedFile }"
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
    <div class="right">
        <a class="btn" v-show="selectedFile !== null" @click="selectFile(selectedFile)">Select</a>
        <a class="btn" @click="selectFile(null)">Cancel</a>
    </div>
</div>
        `
    })
}