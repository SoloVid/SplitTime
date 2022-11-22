import { Perspective } from "engine/perspective";
import { LoadingScreen } from "engine/ui/loading-screen";
import { assert } from "globals";
import { Collage, instanceOfCollage } from "../file/collage";
import { FileData, instanceOfFileData } from "../world/level/level-file-data";
import { Assets } from "./assets";

export interface CompiledGameData {
    levels: {
        [levelFilePath: string]: FileData;
    };
    collages: {
        [collageFilePath: string]: Collage;
    };
    musicFiles: readonly string[];
    imageFiles: readonly string[];
    preloadedImageFiles: readonly string[];
    soundEffectFiles: readonly string[];
}
export function load(perspective: Perspective, ASSETS: Assets): PromiseLike<void> {
    const loadingScreen = new LoadingScreen(perspective.view);
    loadingScreen.show();
    const masterData = perspective.world.gameData
    let itemsLoaded = 0;
    const promiseCollection: PromiseLike<void>[] = [];
    function incrementAndUpdateLoading() {
        itemsLoaded++;
        loadingScreen.show(Math.round((itemsLoaded / promiseCollection.length) * 100));
    }
    // G.ASSETS = new splitTime.Assets(splitTime.getScriptDirectory(), masterData)
    for (const preloadedImageFileName of masterData.preloadedImageFiles) {
        promiseCollection.push(ASSETS.images
            .load("preloaded/" + preloadedImageFileName, preloadedImageFileName, true)
            .then(incrementAndUpdateLoading));
    }
    for (const musicFileName of masterData.musicFiles) {
        ASSETS.audio.registerMusic(musicFileName);
    }
    for (const soundFxFile of masterData.soundEffectFiles) {
        ASSETS.audio.registerSoundEffect(soundFxFile);
    }
    for (const collageFilePath in masterData.collages) {
        const collageData = masterData.collages[collageFilePath];
        assert(instanceOfCollage(collageData), "\"" + collageFilePath + "\" is an invalid collage");
    }
    for (const levelFilePath in masterData.levels) {
        const levelData = masterData.levels[levelFilePath];
        assert(instanceOfFileData(levelData), "\"" + levelFilePath + "\" is an invalid level");
        var levelName = levelFilePath.replace(/\.json$/, "");
        var level = perspective.world.getLevel(levelName);
        promiseCollection.push(level.load(perspective.world, levelData, ASSETS).then(incrementAndUpdateLoading));
    }
    return Promise.all(promiseCollection).then();
}
