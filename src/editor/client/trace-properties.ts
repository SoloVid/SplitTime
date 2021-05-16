namespace splitTime.editor.client {
    export function getTracePropertiesStuff(trace: splitTime.level.file_data.Trace, deleteCallback: () => void): client.ObjectProperties {
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
            targetPosition?: client.FieldOptions
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
            case splitTime.trace.Type.SEND:
                fields.level = {}
                fields.targetPosition = {}
                break
            }

        type SimplifiedTrace = { [K in keyof Required<typeof fields>]: string | number }

        return {
            title: "Trace Properties",
            thing: trace as SimplifiedTrace,
            fields: fields as unknown as { [key: string]: client.FieldOptions },
            doDelete: deleteCallback
        }
    }
}