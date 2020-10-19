namespace splitTime.editor.level {
    export function getLevelPropertiesStuff(level: Level): ObjectProperties {
        const fieldObject = {
            region: {},
            width: {},
            height: {},
            background: {},
            backgroundOffsetX: {},
            backgroundOffsetY: {}
        }
        type SimplifiedLevel = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Level Properties",
            thing: level as SimplifiedLevel,
            fields: fieldObject
        }
    }

    export function getLayerPropertiesStuff(layer: Layer): ObjectProperties {
        const fields = {
            id: {},
            z: {}
        }
        type SimplifiedLayer = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Layer Properties",
            thing: layer.obj as SimplifiedLayer,
            fields
        }
    }
    
    export function getPropPropertiesStuff(prop: splitTime.level.file_data.Prop): ObjectProperties {
        const fields = {
            id: {},
            collage: {},
            parcel: {},
            x: {},
            y: {},
            z: {},
            dir: {},
            playerOcclusionFadeFactor: {}
        }
        type SimplifiedProp = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Prop Properties",
            thing: prop as SimplifiedProp,
            fields
        }
    }
    
    export function getPositionPropertiesStuff(position: splitTime.level.file_data.Position): ObjectProperties {
        const fields = {
            id: {},
            collage: {},
            parcel: {},
            x: {},
            y: {},
            z: {},
            dir: {}
        }
        type SimplifiedPosition = { [K in keyof Required<typeof fields>]: string | number }
        return {
            title: "Position Properties",
            thing: position as SimplifiedPosition,
            fields
        }
    }
    
    export function getTracePropertiesStuff(trace: Trace): ObjectProperties {
        interface TraceFieldOptions {
            id: FieldOptions
            type: FieldOptions
            vertices: FieldOptions
            z: FieldOptions
            height: FieldOptions
            direction?: FieldOptions
            event?: FieldOptions
            level?: FieldOptions
            offsetX?: FieldOptions
            offsetY?: FieldOptions
            offsetZ?: FieldOptions
        }
        let fields: TraceFieldOptions = {
            id: {},
            type: {
                readonly: true
            },
            vertices: {},
            z: {},
            height: {}
        }

        switch(trace.obj.type) {
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
            thing: trace.obj as SimplifiedTrace,
            fields: fields as unknown as { [key: string]: FieldOptions }
        }
    }
}
