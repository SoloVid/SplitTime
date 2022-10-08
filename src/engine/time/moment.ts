import { game_seconds } from "../splitTime";
export class Moment {
    private cachedActualTimeCalculation: game_seconds | null = null;
    /**
     * @param amountOfTime You should probably only specify the time if this is the beginning of a timeline
     */
    constructor(
        private readonly amountOfTime: game_seconds,
        private readonly relativeToOtherMoment: Moment | null
    ) {
        this.amountOfTime = amountOfTime;
    }

    getTime(): game_seconds {
        if (!this.cachedActualTimeCalculation) {
            this.calculateTime();
        }
        return this.cachedActualTimeCalculation as game_seconds;
    }

    private calculateTime() {
        this.cachedActualTimeCalculation = this.amountOfTime;
        if (this.relativeToOtherMoment) {
            this.cachedActualTimeCalculation += this.relativeToOtherMoment.getTime();
        }
    }
}
