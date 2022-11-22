import { CellGrid } from "./cell-grid";
import { Traces2 } from "./level-traces2";
import { FileData } from "./level-file-data";
import { Body } from "engine/world/body/body"
import { Assets } from "engine/assets/assets";
import { game_seconds } from "engine/time/timeline";
import { Canvas } from "engine/ui/viewport/canvas";
import { int } from "globals";
import { Region } from "../region";
import { WeatherSettings } from "../weather-settings";
import { World } from "../world";
import { LevelLoader } from "./level-loader";
import { Position } from "./position";

type EventCallback = ((triggeringBody: Body) => void) | ((triggeringBody: Body, eventId: string) => void);
export class Level {
    id: string;
    private loader: LevelLoader;
    private loaded: boolean = false;
    private events: {
        [id: string]: EventCallback;
    } = {};
    private enterFunction: (() => void) | null = null;
    private exitFunction: (() => void) | null = null;
    private positions: {
        [id: string]: Position;
    } = {};
    region: Region | null = null;
    bodies: Body[] = [];
    background: string = "";
    backgroundOffsetX: int = 0;
    backgroundOffsetY: int = 0;
    _cellGrid: CellGrid | null = null;
    weather: WeatherSettings = new WeatherSettings();
    type: "action" | null = null;
    width: int = 0;
    height: int = 0;
    yWidth: int = 0;
    lowestLayerZ: int = 0;
    highestLayerZ: int = 0;
    _levelTraces: Traces2 | null = null;
    constructor(levelId: string, levelData: FileData) {
        this.id = levelId;
        this.loader = new LevelLoader(this, levelData);
    }
    readFileData(world: World): void {
        this.loader.readFileData(world);
    }
    /**
     * A level can be referenced but not have a level file.
     * This method is to help protect against that.
     */
    private ensureHasFile(): void | never {
        if (!this.loader.hasData()) {
            throw new Error("Not level file found associated with " + this.id);
        }
    }
    private ensureLoaded(): void | never {
        this.ensureHasFile();
        if (!this.isLoaded()) {
            throw new Error("Level " + this.id + " is not currently loaded");
        }
    }
    load(world: World, levelData: FileData, assets: Assets): PromiseLike<void> {
        return this.loader.loadAssets(world, assets);
    }
    getCellGrid(): CellGrid {
        this.ensureLoaded();
        if (!this._cellGrid) {
            throw new Error("CellGrid unavailable");
        }
        return this._cellGrid;
    }
    getLevelTraces(): Traces2 {
        this.ensureLoaded();
        if (!this._levelTraces) {
            throw new Error("Level traces unavailable");
        }
        return this._levelTraces;
    }
    getBackgroundImage(): string {
        if (!this.background) {
            throw new Error("Background image for level " + this.id + " is not set");
        }
        return this.background;
    }
    getDebugTraceCanvas(): Canvas {
        return this.getLevelTraces().getDebugTraceCanvas();
    }
    getRegion(): Region {
        if (!this.region) {
            throw new Error('Level "' + this.id + '" is not assigned to a region');
        }
        return this.region;
    }
    getPosition(positionId: string): Position {
        this.ensureHasFile();
        if (!this.positions[positionId]) {
            throw new Error('Level "' +
                this.id +
                '" does not contain the position "' +
                positionId +
                '"');
        }
        return this.positions[positionId];
    }
    getPositionMap(): {
        [id: string]: Position;
    } {
        return this.positions;
    }
    registerEnterFunction(fun: () => void) {
        this.enterFunction = fun;
    }
    registerExitFunction(fun: () => void) {
        this.exitFunction = fun;
    }
    registerEvent(eventId: string, callback: EventCallback) {
        this.events[eventId] = callback;
    }
    registerPosition(positionId: string, position: Position) {
        this.positions[positionId] = position;
    }
    runEnterFunction() {
        if (this.enterFunction) {
            this.enterFunction();
        }
    }
    runExitFunction() {
        if (this.exitFunction) {
            this.exitFunction();
        }
    }
    private runEvent(eventId: string, triggeringBody: Body) {
        var that = this;
        var fun = this.events[eventId] ||
            function () {
                console.warn('Event "' + eventId + '" not found for level ' + that.id);
            };
        return fun(triggeringBody, eventId);
    }
    runEvents(eventIds: string[], triggeringBody: Body) {
        for (var i = 0; i < eventIds.length; i++) {
            this.runEvent(eventIds[i], triggeringBody);
        }
    }
    notifyTimeAdvance(delta: game_seconds, absoluteTime: game_seconds) {
        this.forEachBody(function (body) {
            body.notifyTimeAdvance(delta, absoluteTime);
        });
    }
    notifyBodyMoved(body: Body) {
        if (this._cellGrid) {
            this._cellGrid.resort(body);
        }
    }
    forEachBody(callback: (body: Body) => void) {
        for (var i = 0; i < this.bodies.length; i++) {
            callback(this.bodies[i]);
        }
    }
    getBodies(): Body[] {
        return this.bodies;
    }
    /**
     * @deprecated Used to be related to rendering; not sure interface is still appropriate
     */
    insertBody(body: Body) {
        if (this.bodies.indexOf(body) < 0) {
            this.bodies.push(body);
        }
        if (this._cellGrid) {
            this._cellGrid.addBody(body);
        }
    }
    /**
     * @deprecated Used to be related to rendering; not sure interface is still appropriate
     */
    removeBody(body: Body) {
        if (this._cellGrid) {
            this._cellGrid.removeBody(body);
        }
        var iBody = this.bodies.indexOf(body);
        if (iBody >= 0) {
            this.bodies.splice(iBody, 1);
        }
    }
    loadForPlay(world: World, assets: Assets): PromiseLike<void> {
        return this.loader.loadForPlay(world, assets).then(() => {
            this.loaded = true;
        });
    }
    unload(assets: Assets): void {
        //TODO: give listeners a chance to clean up
        this.loaded = false;
        this.loader.unload(assets);
    }
    isLoaded(): boolean {
        return this.loaded;
    }
}
