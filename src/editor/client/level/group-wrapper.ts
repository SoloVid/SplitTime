namespace splitTime.editor.level {
    export class GroupWrapper implements splitTime.level.file_data.Group {

        constructor(
            private readonly groupBacking: splitTime.level.file_data.Group,
            private readonly level: Level
        ) {}

        delete(): void {
            // TODO: implement delete
        }

        get id(): string {
            return this.groupBacking.id
        }
        set id(newId: string) {
            if (newId === "") {
                throw new Error("Group ID should not be blank")
            }

            const oldId = this.groupBacking.id
            for (const groupWithMetadata of this.level.groups) {
                const group = groupWithMetadata.obj
                if (group !== this.groupBacking && group.id === newId) {
                    throw new Error("Group ID " + newId + " already taken")
                }
            }
            for (const position of this.level.positions) {
                if (position.obj.group === oldId) {
                    position.obj.group = newId
                }
            }
            for (const position of this.level.props) {
                if (position.obj.group === oldId) {
                    position.obj.group = newId
                }
            }
            for (const position of this.level.traces) {
                if (position.obj.group === oldId) {
                    position.obj.group = newId
                }
            }
            this.groupBacking.id = newId
        }

        get defaultZ(): int {
            return this.groupBacking.defaultZ
        }
        set defaultZ(z: int) {
            this.groupBacking.defaultZ = z
        }

        get defaultHeight(): int {
            return this.groupBacking.defaultHeight
        }
        set defaultHeight(height: int) {
            this.groupBacking.defaultHeight = height
        }
    }
}