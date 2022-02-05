import { Coordinates2D } from "../../../splitTime";
import { warn } from "../../../utils/logger";
export type TracePointSpec = Readonly<Coordinates2D> | string | null;
export function ensureNoPositions(vertices: TracePointSpec[]): (Readonly<Coordinates2D> | null)[] {
    const nonPosVertices: (Coordinates2D | null)[] = [];
    for (const v of vertices) {
        if (typeof v === "string") {
            throw new Error("Unexpected position in trace points");
        }
        nonPosVertices.push(v);
    }
    return nonPosVertices;
}
export function extractCoordinates(points: TracePointSpec[], positions: {
    [id: string]: Readonly<Coordinates2D>;
} = {}): Readonly<Coordinates2D>[] {
    const pointsAndNulls = convertPositions(points, positions);
    return pointsAndNulls.map(p => {
        if (p === null) {
            const firstPoint = pointsAndNulls[0];
            if (firstPoint === null) {
                throw new Error("First point needs to be specified");
            }
            return firstPoint;
        }
        return p;
    });
}
export function convertPositions(points: TracePointSpec[], positions: {
    [id: string]: Readonly<Coordinates2D>;
} = {}): (Readonly<Coordinates2D> | null)[] {
    function getPoint(spec: TracePointSpec): Readonly<Coordinates2D> | null {
        if (spec === null) {
            return null;
        }
        if (typeof spec === "string") {
            const pos = positions[spec];
            if (!pos) {
                throw new Error("Unable to find position \"" + spec + "\" in list of " +
                    Object.keys(positions).length + " positions");
            }
            return pos;
        }
        return spec;
    }
    return points.map(getPoint);
}
export function makePositionPoint(positionId: string): string {
    return "(pos:" + positionId + ")";
}
export function interpretPointString(traceStr: string): TracePointSpec[] {
    const pointsArr: TracePointSpec[] = [];
    const pointRegex = /\([^\)]+\)/g;
    const posRegex = /\(pos:(.+)\)/;
    const xRegex = /\(([-]?[\d]+),/;
    const yRegex = /,[\s]*([-]?[\d]+)\)/;
    const points = traceStr.match(pointRegex);
    if (!points || points.length === 0) {
        throw new Error("Empty trace string: " + traceStr);
    }
    for (const point of points) {
        const posMatch = point.match(posRegex);
        const xMatch = point.match(xRegex);
        const yMatch = point.match(yRegex);
        if (point === "(close)") {
            pointsArr.push(null);
        }
        else if (posMatch !== null) {
            pointsArr.push(posMatch[1]);
        }
        else if (xMatch !== null && yMatch !== null) {
            pointsArr.push({
                x: +xMatch[1],
                y: +yMatch[1]
            });
        }
        else {
            warn("Invalid trace point " +
                point + ' in trace string "' +
                traceStr + '"');
        }
    }
    return pointsArr;
}
