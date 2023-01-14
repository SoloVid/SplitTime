import { PointerOffset, Trace } from "./trace/trace";
import { TraceLayer } from "./level-trace-layer";
import { ENABLED } from "../../utils/debug";
import { Canvas } from "engine/ui/viewport/canvas";
import { MAX_SAFE_INTEGER } from "engine/utils/misc";
import { __DOM__ } from "environment";
import { assert, int } from "globals";
export const SELF_LEVEL_ID = "__SELF_LEVEL_ID__";
interface MinimalLevel {
    lowestLayerZ: number;
}
export class SolidCollisionInfo {
    containsSolid: boolean = false;
    zBlockedTopEx: int;
    constructor(level: MinimalLevel) {
        this.zBlockedTopEx = level.lowestLayerZ;
    }
}
export type PointerTraceInfo = {
    [offsetHash: string]: PointerOffset | null;
};
export type EventTraceInfo = {
    [eventId: string]: true;
};
export class Traces2 {
    readonly layerZs: readonly int[];
    readonly layerCount: int;
    readonly granularityBucketsWide: readonly int[];
    private readonly layers: readonly TraceLayer[];
    // This value could potentially be exposed or calculated dynamically.
    // There is a hard limit of 16 traces per pixel in the current paradigm,
    // so this value determines the largest area affected by this
    // technical limitation.
    readonly traceBinWidth: int = 16;
    readonly binsWide: int;
    readonly traceBinArraySize: int;
    private debugTraceCanvas: Canvas | null = null;
    constructor(readonly traces: readonly Trace[], readonly width: int, readonly yWidth: int, 
    /** Granularities of data buckets, lowest granularity to highest (1 omitted). */
    readonly granularities: readonly int[] = [16]) {
        this.binsWide = Math.ceil(this.width / this.traceBinWidth);
        this.traceBinArraySize = this.binsWide * Math.ceil(this.yWidth / this.traceBinWidth);
        assert(this.granularities.length > 0, 'For optimization, traces must have some additional levels of granularity');
        const granularityBucketsWide: int[] = [];
        let prevG = 1;
        for (const g of this.granularities) {
            assert(g % prevG === 0, `Granularities should be successive multiples. ${g} is not a multiple of ${prevG}`);
            prevG = g;
            granularityBucketsWide.push(Math.ceil(this.width / g));
        }
        this.granularityBucketsWide = granularityBucketsWide;
        const _layerZs = this.calculateLayerZs(this.traces);
        this.layerCount = _layerZs.length;
        // Put a sentinel on the end
        _layerZs.push(MAX_SAFE_INTEGER);
        this.layerZs = _layerZs;
        const _layers: TraceLayer[] = [];
        this.layers = _layers;
        for (let iLayer = 0; iLayer < this.layerCount; iLayer++) {
            _layers.push(new TraceLayer(this, this.layerZs[iLayer], this.layerZs[iLayer + 1]));
        }
        if (__DOM__ && ENABLED) {
            this.debugTraceCanvas = new Canvas(this.width, this.yWidth);
            const debugTraceCtx = this.debugTraceCanvas.context;
            debugTraceCtx.clearRect(0, 0, this.debugTraceCanvas.width, this.debugTraceCanvas.height);
            for (const traceLayer of this.layers) {
                debugTraceCtx.drawImage(traceLayer.getDebugTraceCanvas().element, 0, -traceLayer.z);
            }
        }
    }
    private calculateLayerZs(traces: readonly Trace[]): int[] {
        let layerZs = this.fillLayerZGaps(traces, traces.map(t => Math.floor(t.spec.offsetZ)));
        return layerZs.sort((a, b) => a - b);
    }
    // It isn't enough to just create a layer for every trace z.
    // If a trace is too tall, it might exceed the 255 limit
    // imposed by the resolution of RGB colors used by this collision scheme.
    // This method creates more layers as necessary for such cases.
    private fillLayerZGaps(traces: readonly Trace[], zArray: readonly int[]): int[] {
        const zSet: {
            [z: number]: true;
        } = {};
        for (const z of zArray) {
            zSet[z] = true;
        }
        // Technically, this is something like 255 based on the limit of pixels
        const MAX_LAYER_Z = 240;
        for (const trace of traces) {
            const spec = trace.spec;
            let startZ = spec.offsetZ;
            for (let currentZ = startZ; currentZ < spec.offsetZ + spec.height; currentZ++) {
                if (zSet[currentZ]) {
                    startZ = currentZ;
                }
                else if (currentZ - startZ > MAX_LAYER_Z) {
                    zSet[currentZ] = true;
                    startZ = currentZ;
                }
            }
        }
        const newZArray: int[] = [];
        for (const z in zSet) {
            newZArray.push(+z);
        }
        return newZArray.sort((a, b) => a - b);
    }
    calculateVolumeSolidCollision(collisionInfo: SolidCollisionInfo, startX: int, xPixels: int, startY: int, yPixels: int, minZ: int, exMaxZ: int) {
        for (const traceLayer of this.layers) {
            if (exMaxZ > traceLayer.z && minZ < traceLayer.nextLayerZ) {
                traceLayer.calculateAreaSolidCollision(collisionInfo, startX, xPixels, startY, yPixels, minZ);
            }
        }
    }
    calculateVolumePointers(pointerInfo: PointerTraceInfo, startX: int, xPixels: int, startY: int, yPixels: int, minZ: int, exMaxZ: int) {
        // TODO: Check exMaxZ > level.lowestZ maybe.
        if (exMaxZ <= this.layers[0].z) {
            pointerInfo[SELF_LEVEL_ID] = null;
        }
        for (const traceLayer of this.layers) {
            if (exMaxZ > traceLayer.z && minZ < traceLayer.nextLayerZ) {
                traceLayer.calculateAreaPointers(pointerInfo, startX, xPixels, startY, yPixels, minZ, exMaxZ);
            }
        }
    }
    calculateVolumeEvents(eventInfo: EventTraceInfo, startX: int, xPixels: int, startY: int, yPixels: int, minZ: int, exMaxZ: int) {
        for (const traceLayer of this.layers) {
            if (exMaxZ > traceLayer.z && minZ < traceLayer.nextLayerZ) {
                traceLayer.calculateAreaEvents(eventInfo, startX, xPixels, startY, yPixels, minZ, exMaxZ);
            }
        }
    }
    getDebugTraceCanvas(): Canvas {
        assert(this.debugTraceCanvas !== null, "Debug trace canvas requested when null");
        return this.debugTraceCanvas;
    }
}