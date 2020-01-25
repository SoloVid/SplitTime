namespace SplitTime {
    export class WeatherSettings {
        isRaining: boolean = false;
        // Number of lightning strikes per minute
        lightningFrequency: number = 0;
        isCloudy: boolean = false;
        // 0-1 invisible to fully visible
        cloudAlpha: number = 1;
        // 0-1 not dark to 100% dark
        darkness: number = 0;
    }
}