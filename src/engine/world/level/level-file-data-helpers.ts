namespace splitTime.level.file_data {
    export function makeTrace(partialTrace: Partial<Trace>): Trace {
        const trace: Trace = {
            id: "",
            group: "",
            type: "",
            vertices: "",
            z: 0,
            height: 0,
            direction: "",
            event: "",
            level: "",
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            targetPosition: ""
        }
        Object.assign(trace, partialTrace)
        // for (const key in partialTrace) {
        //     if (key in trace) {
        //         assert(typeof trace[key] === typeof partialTrace[key], "Types should match");
        //         trace[key] = partialTrace[key]
        //     }
        // }
        return trace
    }
}
