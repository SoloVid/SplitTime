import { FileData } from "./level-file-data";
import { Level, World, Position, Trace, level, assert, Sprite, SpriteBody } from "../../splitTime";
import { CellGrid } from "./cell-grid";
import { interpret } from "../../math/direction";
import { warn } from "../../utils/logger";
import { TraceSpec } from "./trace/trace-spec";
import { Type } from "./trace/trace-misc";
import { smoothPut } from "../body/render/ghosty";
import { extractCoordinates } from "./trace/trace-points";
import { ASSETS } from "../../G";
import { Traces2 } from "./level-traces2";
import * as splitTime from "../../splitTime";
export class LevelLoader {
    private fileData: FileData | null = null;
    constructor(private readonly level: Level, private readonly levelData: FileData) { }
    hasData(): boolean {
        return this.fileData !== null;
    }
    readFileData(world: World): void {
        world.getRegion(this.levelData.region).addLevel(this.level);
        this.fileData = this.levelData;
        this.level.type = this.levelData.type;
        this.level.width = this.levelData.width || 0;
        this.level.height = this.levelData.height || 0;
        this.level.lowestLayerZ = 0;
        this.level.highestLayerZ = 0;
        for (const trace of this.levelData.traces) {
            if (trace.z < this.level.lowestLayerZ) {
                this.level.lowestLayerZ = +trace.z;
            }
            if (trace.z > this.level.highestLayerZ) {
                this.level.highestLayerZ = +trace.z;
            }
        }
        this.level.yWidth = this.level.height + this.level.highestLayerZ;
        this.level._cellGrid = new CellGrid(this.level);
        this.level.background = this.levelData.background;
        this.level.backgroundOffsetX = this.levelData.backgroundOffsetX;
        this.level.backgroundOffsetY = this.levelData.backgroundOffsetY;
        //Pull positions from file
        for (var i = 0; i < this.levelData.positions.length; i++) {
            var posObj = this.levelData.positions[i];
            var position = new Position(this.level, +posObj.x, +posObj.y, +posObj.z, interpret(posObj.dir), 
            // TODO: resolve confusion of "montage" and "stance"
            posObj.montage);
            if (posObj.id) {
                this.level.registerPosition(posObj.id, position);
            }
            else {
                warn("position missing id in level: " + this.level.id);
            }
        }
        for (const rawTrace of this.levelData.traces) {
            const traceSpec = TraceSpec.fromRaw(rawTrace);
            const t = new Trace(traceSpec);
            t.load(this.level, world);
            switch (traceSpec.type) {
                case Type.TRANSPORT:
                    const pointerOffset = t.getPointerOffset();
                    const transportTraceId = traceSpec.getOffsetHash();
                    this.level.registerEvent(transportTraceId, ((trace, level) => {
                        return (body: splitTime.Body) => {
                            if (body.levelLocked) {
                                return;
                            }
                            smoothPut(body, {
                                level: pointerOffset.level,
                                x: body.x + pointerOffset.offsetX,
                                y: body.y + pointerOffset.offsetY,
                                z: body.z + pointerOffset.offsetZ
                            });
                        };
                    })(t, level));
                    break;
                case Type.SEND:
                    const sendTraceId = traceSpec.getOffsetHash();
                    this.level.registerEvent(sendTraceId, ((trace, level) => {
                        return (body: splitTime.Body) => {
                            if (body.levelLocked) {
                                return;
                            }
                            const targetPosition = trace.getTargetPosition();
                            smoothPut(body, targetPosition);
                        };
                    })(t, level));
                    break;
                case Type.PATH:
                    this.connectPositionsFromPath(t.spec);
                    break;
            }
        }
    }
    connectPositionsFromPath(traceSpec: TraceSpec) {
        const points = traceSpec.getOffsetVertices();
        for (let i = 0; i < points.length; i++) {
            const point1 = points[i];
            if (typeof point1 === "string") {
                const position1 = this.level.getPosition(point1);
                for (let j = i + 1; j < points.length; j++) {
                    const point2 = points[j];
                    if (typeof point2 === "string") {
                        const position2 = this.level.getPosition(point2);
                        const midPoints = extractCoordinates(points.slice(i + 1, j));
                        position1.registerPath(position2, midPoints.slice());
                        position2.registerPath(position1, midPoints.slice().reverse());
                        break;
                    }
                }
            }
        }
    }
    private refetchBodies(world: World) {
        assert(this.fileData !== null, "Level must have file data");
        this.level._cellGrid = new CellGrid(this.level);
        for (const body of this.level.bodies) {
            this.level._cellGrid.addBody(body);
        }
        for (const prop of this.fileData.props) {
            const collageMontage = ASSETS.collages.get(prop.collage).getMontage(prop.montage);
            // const sprite = new Sprite(prop.collage, prop.montage)
            const body = new splitTime.Body();
            body.ethereal = true;
            const sprite = new Sprite(body, prop.collage, prop.montage);
            sprite.playerOcclusionFadeFactor = collageMontage.playerOcclusionFadeFactor;
            body.width = collageMontage.bodySpec.width;
            body.depth = collageMontage.bodySpec.depth;
            body.height = collageMontage.bodySpec.height;
            body.drawables.push(sprite);
            body.id = prop.id;
            body.put(this.level, +prop.x, +prop.y, +prop.z, true);
            if (prop.dir !== "") {
                body.dir = interpret(prop.dir);
            }
            body.levelLocked = true;
            sprite.requestStance(prop.montage, body.dir, true, true);
            const spriteBody = new SpriteBody(sprite, body);
            if (!!collageMontage.propPostProcessorId) {
                world.propPostProcessor.process(collageMontage.propPostProcessorId, spriteBody, prop);
            }
        }
    }
    async loadAssets(world: World): Promise<void> {
        await ASSETS.images.load(this.level.background);
    }
    async loadForPlay(world: World): Promise<void> {
        await this.loadAssets(world);
        this.refetchBodies(world);
        assert(this.fileData !== null, "Level must have file data to be loaded");
        const traceSpecs = this.fileData.traces.map(t => TraceSpec.fromRaw(t));
        for (const prop of this.fileData.props) {
            const collageMontage = ASSETS.collages.get(prop.collage).getMontage(prop.montage, prop.dir);
            for (const t of collageMontage.traces) {
                const spec = TraceSpec.fromRaw(t);
                spec.offset.x = prop.x;
                spec.offset.y = prop.y;
                spec.offset.z = prop.z;
                traceSpecs.push(spec);
            }
        }
        const traces = traceSpecs.map(spec => {
            const trace = new Trace(spec);
            trace.load(this.level, world);
            return trace;
        });
        this.level._levelTraces = new Traces2(traces, this.level.width, this.level.yWidth);
    }
    unload() {
        //Clear out all functional maps and other high-memory resources
        this.level._levelTraces = null;
        this.level._cellGrid = null;
        for (const body of this.level.bodies) {
            if (body.ethereal) {
                const llBefore = body.levelLocked;
                body.levelLocked = false;
                body.clearLevel();
                body.levelLocked = llBefore;
            }
        }
    }
}
