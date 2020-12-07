namespace splitTime.editor.level {
    export function getLevelPropertiesStuff(level: Level): client.ObjectProperties {
        const fieldObject = {
            region: {},
            width: {},
            height: {},
            background: {
                isFile: true,
                fileBrowserRoot: splitTime.IMAGE_DIR
            },
            backgroundOffsetX: {},
            backgroundOffsetY: {}
        }
        type SimplifiedLevel = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Level Properties",
            thing: level as SimplifiedLevel,
            fields: fieldObject,
            doDelete: null
        }
    }

    export function getGroupPropertiesStuff(level: Level, group: splitTime.level.file_data.Group): client.ObjectProperties {
        const fields = {
            id: {},
            parent: {},
            defaultZ: {},
            defaultHeight: {}
        }
        type SimplifiedGroup = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Group Properties",
            thing: group as SimplifiedGroup,
            fields,
            doDelete: () => {
                level.groups = level.groups.filter(g => g.obj.id !== group.id)
            }
        }
    }
    
    export function getPropPropertiesStuff(level: Level, prop: splitTime.level.file_data.Prop): client.ObjectProperties {
        const fields = {
            id: {},
            group: {},
            collage: {},
            montage: {},
            x: {},
            y: {},
            z: {},
            dir: {}
        }
        type SimplifiedProp = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Prop Properties",
            thing: prop as SimplifiedProp,
            fields,
            doDelete: () => {
                level.props = level.props.filter(p => p.obj !== prop)
            }
        }
    }
    
    export function getPositionPropertiesStuff(level: Level, position: splitTime.level.file_data.Position): client.ObjectProperties {
        const fields = {
            id: {},
            group: {},
            collage: {},
            montage: {},
            x: {},
            y: {},
            z: {},
            dir: {}
        }
        const wrappedPosition = new PositionWrapper(position, level)
        type SimplifiedPosition = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Position Properties",
            thing: wrappedPosition as SimplifiedPosition,
            fields,
            doDelete: () => wrappedPosition.delete()
        }
    }
    
    export function getTracePropertiesStuff(level: Level, trace: splitTime.level.file_data.Trace): client.ObjectProperties {
        interface TraceFieldOptions {
            id: client.FieldOptions
            group: client.FieldOptions
            type: client.FieldOptions
            vertices: client.FieldOptions
            z: client.FieldOptions
            height: client.FieldOptions
            direction?: client.FieldOptions
            event?: client.FieldOptions
            level?: client.FieldOptions
            offsetX?: client.FieldOptions
            offsetY?: client.FieldOptions
            offsetZ?: client.FieldOptions
        }
        let fields: TraceFieldOptions = {
            id: {},
            group: {},
            type: {
                readonly: true
            },
            vertices: {},
            z: {},
            height: {}
        }

        switch(trace.type) {
            case splitTime.trace.Type.STAIRS:
                fields.direction = {}
                break
            case splitTime.trace.Type.EVENT:
                fields.event = {}
                break
            case splitTime.trace.Type.POINTER:
            case splitTime.trace.Type.TRANSPORT:
                fields.level = {}
                fields.offsetX = {}
                fields.offsetY = {}
                fields.offsetZ = {}
                break
        }

        type SimplifiedTrace = { [K in keyof Required<typeof fields>]: string | number }

        return {
            title: "Trace Properties",
            thing: trace as SimplifiedTrace,
            fields: fields as unknown as { [key: string]: client.FieldOptions },
            doDelete: () => {
                level.traces = level.traces.filter(t => t.obj !== trace)
            }
        }
    }
}
