import { Indirect, redirect } from "engine/redirect";
import { Color } from "../light/color";

export class WeatherSettings {
    isRaining: boolean = false;
    // Number of lightning strikes per minute
    lightningFrequency: number = 0;
    isCloudy: boolean = false;
    // 0-1 invisible to fully visible
    cloudAlpha: number = 1;
    // Color of light (e.g. black for darkness)
    ambientLight: Indirect<Color> = new Color(255, 255, 255);
    getAmbientLight(): Color {
        return redirect(this.ambientLight);
    }
}
