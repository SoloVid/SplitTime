
namespace SplitTime.level {
    export namespace traces {
        export function ZRange(minZ, exMaxZ) {
            this.minZ = minZ;
            this.exMaxZ = exMaxZ;
        }
        
        export function CollisionInfo() {
            this.containsSolid = false;
            /** @type {Object.<string, SplitTime.Trace>} */
            this.pointerTraces = {};
            /** @type {int} */
            this.zBlockedTopEx = 0;
            /** @type {int} */
            this.zBlockedBottom = SLVD.MAX_SAFE_INTEGER;
            /** @type {Object.<string, ZRange>} */
            this.events = {};
        };
    }
    
    export class Traces {
        level: SplitTime.Level;
        levelFileData: SplitTime.level.FileData;
        layerFuncData: ImageData[];
        _internalEventIdMap: any;
        _internalPointerTraceMap: any;
        debugTraceCanvas: HTMLCanvasElement;
        
        /**
        * @constructor
        * @property {ImageData[]} layerFuncData
        * @param {SplitTime.Level} level
        * @param {SplitTime.LevelFileData} levelFileData
        */
        constructor(level: SplitTime.Level, levelFileData: SplitTime.level.FileData) {
            this.level = level;
            this.levelFileData = levelFileData;
            /** @type ImageData[] */
            this.layerFuncData = [];
            
            this.initCanvasData();
        };
        
        getEventIdFromPixel(r, g, b, a) {
            var eventIntId = SplitTime.Trace.getEventIdFromColor(r, g, b, a);
            return this._internalEventIdMap[eventIntId];
        };
        
        /**
        * @return {SplitTime.Trace}
        */
        getPointerTraceFromPixel(r, g, b, a) {
            var pointerIntId = SplitTime.Trace.getPointerIdFromColor(r, g, b, a);
            return this._internalPointerTraceMap[pointerIntId];
        };
        
        /**
        * Check that the volume is open in level collision canvas data.
        * @param {SplitTime.LevelTraces.CollisionInfo} collisionInfo
        * @param {int} startX
        * @param {int} xPixels
        * @param {int} startY
        * @param {int} yPixels
        * @param {number} minZ
        * @param {number} exMaxZ (positive)
        */
        calculateVolumeCollision(collisionInfo, startX, xPixels, startY, yPixels, minZ, exMaxZ) {
            for(var y = startY; y < startY + yPixels; y++) {
                for(var x = startX; x < startX + xPixels; x++) {
                    this.calculatePixelColumnCollisionInfo(collisionInfo, x, y, minZ, exMaxZ);
                }
            }
        };
        
        /**
        * Check that the pixel is open in level collision canvas data.
        * @param {SplitTime.LevelTraces.CollisionInfo} collisionInfo
        * @param {int} x
        * @param {int} y
        * @param {number} minZ
        * @param {number} exMaxZ (positive)
        */
        calculatePixelColumnCollisionInfo(collisionInfo, x, y, minZ, exMaxZ) {
            for(var iLayer = 0; iLayer < this.levelFileData.layers.length; iLayer++) {
                var layerZ = this.levelFileData.layers[iLayer].z;
                var nextLayer = this.levelFileData.layers[iLayer + 1];
                var nextLayerZ = nextLayer ? nextLayer.z : SLVD.MAX_SAFE_INTEGER;
                if(exMaxZ > layerZ && minZ < nextLayerZ) {
                    this._calculatePixelCollision(collisionInfo, x, y, iLayer, layerZ, Math.max(layerZ, minZ), Math.min(nextLayerZ, exMaxZ));
                }
            }
        };
        
        /**
        *
        * @param {SplitTime.LevelTraces.CollisionInfo} collisionInfo
        * @param {int} x
        * @param {int} y
        * @param {int} layer
        * @param layerZ
        * @param minZ
        * @param exMaxZ
        * @private
        */
        _calculatePixelCollision(collisionInfo, x, y, layer, layerZ, minZ, exMaxZ) {
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
            
            var debugTraceCtx;
            if(SplitTime.debug.ENABLED) {
                this.debugTraceCanvas = document.createElement("canvas");
                this.debugTraceCanvas.width = this.level.width;
                this.debugTraceCanvas.height = this.level.height;
                debugTraceCtx = this.debugTraceCanvas.getContext("2d");
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
                        var height = trace.height || layerHeight;
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
                
                if(SplitTime.debug.ENABLED) {
                    debugTraceCtx.drawImage(holderCanvas, 0, -layerZ);
                }
            }
        };
        
        getDebugTraceCanvas() {
            return this.debugTraceCanvas;
        };
    }
}