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
        return client.getTracePropertiesStuff(trace, () => {
            level.traces = level.traces.filter(t => t.obj !== trace)
        })
    }
}
