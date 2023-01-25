import { TracePointSpec, interpretPointString, ensureNoPositions } from "./trace-points";
import { Trace as FileTrace } from "../level-file-data";
import { TraceType, TraceTypeType } from "./trace-type";
import { direction_t, interpret, toRadians } from "../../../math/direction";
import { Polygon } from "../../../math/polygon/polygon";
import { assert } from "globals";
import { Vector2D } from "engine/math/vector2d";
import { Coordinates3D, instanceOfCoordinates2D, Coordinates2D } from "../level-location";

export class TraceSpec {
    readonly type: TraceTypeType;
    readonly vertices: TracePointSpec[];
    readonly z: number = 0;
    readonly height: number = 0;
    readonly linkLevel: string = "";
    readonly linkOffsetX: number = 0;
    readonly linkOffsetY: number = 0;
    readonly linkOffsetZ: number = 0;
    readonly linkPosition: string = "";
    private offsetHash: string = "";
    readonly direction: direction_t | null = null;
    readonly eventId: string = "";
    readonly color: string = "";
    /** variable offset to apply to all coordinates, e.g. position of body if spec is relative */
    offset: Coordinates3D = new Coordinates3D();
    private constructor(rawTrace: FileTrace) {
        this.type = rawTrace.type;
        this.vertices = interpretPointString(rawTrace.vertices);
        this.z = +rawTrace.z;
        this.height = +rawTrace.height;
        switch (this.type) {
            case TraceType.STAIRS:
                this.direction = interpret(rawTrace.direction ?? "");
                break;
            case TraceType.EVENT:
                this.eventId = rawTrace.event ?? "";
                break;
            case TraceType.POINTER:
            case TraceType.TRANSPORT:
                this.linkLevel = rawTrace.level ?? "";
                this.linkOffsetX = rawTrace.offsetX ?? 0;
                this.linkOffsetY = rawTrace.offsetY ?? 0;
                this.linkOffsetZ = rawTrace.offsetZ ?? 0;
                this.generateOffsetHash();
                break;
            case TraceType.SEND:
                this.linkLevel = rawTrace.level ?? "";
                this.linkPosition = rawTrace.targetPosition ?? "";
                this.generateOffsetHash();
                break;
            case TraceType.RENDER:
                this.color = rawTrace.color ?? "";
                break;
        }
    }
    /**
     * Basically a constructor for Trace from level file data
     */
    static fromRaw(rawTrace: FileTrace): TraceSpec {
        return new TraceSpec(rawTrace);
    }
    getOffsetHash() {
        return this.offsetHash;
    }
    private generateOffsetHash() {
        this.offsetHash = [
            this.linkLevel,
            this.linkOffsetX,
            this.linkOffsetY,
            this.linkOffsetZ,
            this.linkPosition
        ].join(",");
    }
    calculateStairsExtremes(): {
        top: Vector2D;
        bottom: Vector2D;
    } {
        const polygon = this.getPolygon();
        assert(this.direction !== null, "Stairs must have a direction");
        const top = polygon.findPointToward(toRadians(this.direction));
        const bottom = polygon.findPointToward(toRadians(this.direction) + Math.PI);
        return {
            top: top,
            bottom: bottom
        };
    }
    /** z value of trace spec with offset applied */
    get offsetZ(): number {
        return this.z + this.offset.z;
    }
    /** vertices of trace spec with offset applied */
    getOffsetVertices(): TracePointSpec[] {
        return this.vertices.map(v => {
            if (instanceOfCoordinates2D(v)) {
                return new Coordinates2D(v.x + this.offset.x, v.y + this.offset.y);
            }
            return v;
        });
    }
    getPolygon(): Polygon {
        const points = ensureNoPositions(this.getOffsetVertices())
            .filter(v => v !== null)
            .map(v => new Vector2D(v!.x, v!.y));
        return new Polygon(points);
    }
}
