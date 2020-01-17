
namespace SplitTime.level {
    export namespace traces {
        export class ZRange {
            // FTODO: int?
            constructor(public minZ: number, public exMaxZ: number) {

            }
        }

        export class CollisionInfo {
            containsSolid: boolean;
            pointerTraces: { [levelId: string]: SplitTime.Trace };
            zBlockedTopEx: int;
            zBlockedBottom: int;
            events: { [eventId: string]: ZRange };
            constructor() {
                this.containsSolid = false;
                this.pointerTraces = {};
                this.zBlockedTopEx = 0;
                this.zBlockedBottom = SLVD.MAX_SAFE_INTEGER;
                this.events = {};
            }
        }
    }
    
    export class Traces {
        level: SplitTime.Level;
        levelFileData: SplitTime.level.FileData;
        layerFuncData: ImageData[];
        _internalEventIdMap: any;
        _internalPointerTraceMap: any;
        debugTraceCanvas: HTMLCanvasElement | null = null;
        
        constructor(level: SplitTime.Level, levelFileData: SplitTime.level.FileData) {
            this.level = level;
            this.levelFileData = levelFileData;
            this.layerFuncData = [];
            
            this.initCanvasData();
        };
        
        getEventIdFromPixel(r: number, g: number, b: number, a: number) {
            var eventIntId = SplitTime.Trace.getEventIdFromColor(r, g, b, a);
            return this._internalEventIdMap[eventIntId];
        };
        
        /**
        * @return {SplitTime.Trace}
        */
        getPointerTraceFromPixel(r: number, g: number, b: number, a: number): SplitTime.Trace {
            var pointerIntId = SplitTime.Trace.getPointerIdFromColor(r, g, b, a);
            return this._internalPointerTraceMap[pointerIntId];
        };
        
        /**
        * Check that the volume is open in level collision canvas data.
        * @param exMaxZ (positive)
        */
        calculateVolumeCollision(collisionInfo: traces.CollisionInfo, startX: int, xPixels: int, startY: int, yPixels: int, minZ: number, exMaxZ: number) {
            for(var y = startY; y < startY + yPixels; y++) {
                for(var x = startX; x < startX + xPixels; x++) {
                    this.calculatePixelColumnCollisionInfo(collisionInfo, x, y, minZ, exMaxZ);
                }
            }
        };
        
        /**
        * Check that the pixel is open in level collision canvas data.
        * @param exMaxZ (positive)
        */
        calculatePixelColumnCollisionInfo(collisionInfo: traces.CollisionInfo, x: int, y: int, minZ: number, exMaxZ: number) {
            for(var iLayer = 0; iLayer < this.levelFileData.layers.length; iLayer++) {
                var layerZ = this.levelFileData.layers[iLayer].z;
                var nextLayer = this.levelFileData.layers[iLayer + 1];
                var nextLayerZ = nextLayer ? nextLayer.z : SLVD.MAX_SAFE_INTEGER;
                if(exMaxZ > layerZ && minZ < nextLayerZ) {
                    this._calculatePixelCollision(collisionInfo, x, y, iLayer, layerZ, Math.max(layerZ, minZ), Math.min(nextLayerZ, exMaxZ));
                }
            }
        };
        
        private _calculatePixelCollision(collisionInfo: traces.CollisionInfo, x: int, y: int, layer: int, layerZ: number, minZ: number, exMaxZ: number) {
            var imageData = this.layerFuncData[layer];
            var dataIndex = SplitTime.pixCoordToIndex(x, y, imageData);
            var r = imageData.data[dataIndex++];
            var g = imageData.data[dataIndex++];
            var b = imageData.data[dataIndex++];
            var a = imageData.data[dataIndex++];
            if(a === 255) {
                switch(r) {
                    case SplitTime.Trace.RColor.SOLID:
                    var height = layerZ + g;
                    if(height >= minZ) {
                        collisionInfo.containsSolid = true;
                        collisionInfo.zBlockedTopEx = Math.max(height, collisionInfo.zBlockedTopEx);
                        collisionInfo.zBlockedBottom = Math.min(layerZ, collisionInfo.zBlockedBottom);
                    }
                    break;
                    case SplitTime.Trace.RColor.EVENT:
                    var eventId = this.getEventIdFromPixel(r, g, b, a);
                    if(!(eventId in collisionInfo.events)) {
                        collisionInfo.events[eventId] = new traces.ZRange(minZ, exMaxZ);
                    } else {
                        collisionInfo.events[eventId].minZ = Math.min(minZ, collisionInfo.events[eventId].minZ);
                        collisionInfo.events[eventId].exMaxZ = Math.max(exMaxZ, collisionInfo.events[eventId].exMaxZ);
                    }
                    break;
                    case SplitTime.Trace.RColor.POINTER:
                    var trace = this.getPointerTraceFromPixel(r, g, b, a);
                    if(!trace.level) {
                        throw new Error("Pointer trace has no level");
                    }
                    collisionInfo.pointerTraces[trace.level.id] = trace;
                    break;
                }
            }
        };
        
        initCanvasData() {
            this._internalEventIdMap = {};
            this._internalPointerTraceMap = {};
            var nextFunctionId = 1;
            var nextPointerId = 1;
            
            var holderCanvas = document.createElement("canvas");
            holderCanvas.width = this.level.width/(this.level.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
            holderCanvas.height = this.level.yWidth/(this.level.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
            var holderCtx = holderCanvas.getContext("2d");

            if(holderCtx === null) {
                throw new Error("Unable to initialize holderCtx");
            }
            
            var debugTraceCtx = null;
            if(SplitTime.debug.ENABLED) {
                this.debugTraceCanvas = document.createElement("canvas");
                this.debugTraceCanvas.width = this.level.width;
                this.debugTraceCanvas.height = this.level.height;
                debugTraceCtx = this.debugTraceCanvas.getContext("2d");
                if(debugTraceCtx === null) {
                    throw new Error("Unable to initialize debugTraceCtx");
                }
                debugTraceCtx.clearRect(0, 0, this.debugTraceCanvas.width, this.debugTraceCanvas.height);
            }
            
            //Initialize functional map
            for(var iLayer = 0; iLayer < this.levelFileData.layers.length; iLayer++) {
                holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);
                
                var layerZ = this.levelFileData.layers[iLayer].z;
                var nextLayer = this.levelFileData.layers[iLayer + 1];
                var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_VALUE;
                var layerHeight = nextLayerZ - layerZ;
                
                //Draw traces
                var layerTraces = this.levelFileData.layers[iLayer].traces;
                
                holderCtx.translate(0.5, 0.5);
                
                for(var iLayerTrace = 0; iLayerTrace < layerTraces.length; iLayerTrace++) {
                    var trace = layerTraces[iLayerTrace];
                    var type = trace.type;
                    switch(type) {
                        case SplitTime.Trace.Type.EVENT:
                        var eventStringId = trace.event;
                        var eventIntId = nextFunctionId++;
                        this._internalEventIdMap[eventIntId] = eventStringId;
                        var functionColor = SplitTime.Trace.getEventColor(eventIntId);
                        SplitTime.Trace.drawColor(trace.vertices, holderCtx, functionColor);
                        break;
                        case SplitTime.Trace.Type.SOLID:
                        var height = +trace.height || layerHeight;
                        SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(height));
                        break;
                        case SplitTime.Trace.Type.GROUND:
                        SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(0));
                        break;
                        case SplitTime.Trace.Type.STAIRS:
                        var stairsUpDirection = trace.direction;
                        var gradient = SplitTime.Trace.calculateGradient(trace.vertices, holderCtx, stairsUpDirection);
                        gradient.addColorStop(0, SplitTime.Trace.getSolidColor(0));
                        gradient.addColorStop(1, SplitTime.Trace.getSolidColor(layerHeight));
                        SplitTime.Trace.drawColor(trace.vertices, holderCtx, gradient);
                        break;
                        case SplitTime.Trace.Type.POINTER:
                        var pointerIntId = nextPointerId++;
                        // TODO: actual SplitTime.Trace object
                        this._internalPointerTraceMap[pointerIntId] = SplitTime.Trace.fromRaw(trace);
                        var pointerColor = SplitTime.Trace.getPointerColor(pointerIntId);
                        SplitTime.Trace.drawColor(trace.vertices, holderCtx, pointerColor);
                        break;
                        case SplitTime.Trace.Type.TRANSPORT:
                            var transportTrace = SplitTime.Trace.fromRaw(trace);
                            var transportStringId = transportTrace.getLocationId();
                            var transportIntId = nextFunctionId++;
                            this._internalEventIdMap[transportIntId] = transportStringId;
                            var transportColor = SplitTime.Trace.getEventColor(transportIntId);
                            SplitTime.Trace.drawColor(trace.vertices, holderCtx, transportColor);
                            break;
                        default:
                        SplitTime.Trace.draw(layerTraces[iLayerTrace].vertices, holderCtx, type);
                    }
                }
                
                // TODO: traces related to props
                
                holderCtx.translate(-0.5, -0.5);
                
                this.layerFuncData[iLayer] = holderCtx.getImageData(0, 0, holderCanvas.width, holderCanvas.height);
                
                if(SplitTime.debug.ENABLED && debugTraceCtx !== null) {
                    debugTraceCtx.drawImage(holderCanvas, 0, -layerZ);
                }
            }
        };
        
        getDebugTraceCanvas() {
            return this.debugTraceCanvas;
        };
    }
}