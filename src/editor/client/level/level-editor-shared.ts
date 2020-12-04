namespace splitTime.editor.level {
    export class SharedStuff implements LevelEditorShared {
        activeGroup: int = -1
        readonly collageManager: CollageManager
        mode: Mode = "trace"
        selectedCollage: string = ""
        selectedMontage: string = ""
        selectedMontageDirection: string = ""
        selectedMontageObject: file.collage.Montage | null = null
        selectedTraceType: string = trace.Type.SOLID
        pathInProgress: splitTime.level.file_data.Trace | null = null
        readonly info = {}
        propertiesPaneStuff: client.ObjectProperties | null

        constructor(
            private editor: VueLevelEditor
        ) {
            this.propertiesPaneStuff = getLevelPropertiesStuff(this.editor.level)
            this.collageManager = new CollageManager(this.server)
            if (this.editor.level && this.editor.level.groups.length > 0) {
                this.activeGroup = 0
            }
        }

        get gridCell(): Vector2D {
            return this.editor.editorGlobalStuff.gridCell
        }

        get gridEnabled(): boolean {
            return this.editor.editorGlobalStuff.gridEnabled
        }

        get level(): Level {
            return this.editor.level
        }

        get server(): client.ServerLiaison {
            return this.editor.editorGlobalStuff.server
        }

        get time(): game_seconds {
            return this.editor.editorGlobalStuff.time
        }

        shouldDragBePrevented(): boolean {
            return this.editor.editorInputs.mouse.isDown || this.pathInProgress !== null
        }

        follow(follower: client.Followable): void {
            this.editor.editorGlobalStuff.setFollowers([follower])
        }

        editProperties(propertiesSpec: client.ObjectProperties): void {
            this.propertiesPaneStuff = propertiesSpec
            const doDelete = propertiesSpec.doDelete
            if (!doDelete) {
                this.editor.editorGlobalStuff.setOnDelete(() => {})
                return
            }
            const fullDoDelete = () => {
                this.propertiesPaneStuff = null
                doDelete()
                this.editor.editorGlobalStuff.setOnDelete(() => {})
            }
            propertiesSpec.doDelete = fullDoDelete
            this.editor.editorGlobalStuff.setOnDelete(fullDoDelete)
        }
    }
}