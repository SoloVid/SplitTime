import { Trace as FileTrace } from "./level-file-data";
export function makeTrace(partialTrace: Partial<FileTrace> & Pick<FileTrace, "type">): FileTrace {
    const trace: FileTrace = {
        id: "",
        group: "",
        vertices: "",
        z: 0,
        height: 0,
        ...partialTrace,
    }
    return trace
}
