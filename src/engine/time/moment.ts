import { game_seconds, defer } from "../splitTime";
export class Moment {
    private cachedActualTimeCalculation: game_seconds | null = null;
    private amountOfTime: game_seconds | null = null;
    private relativeOtherMoment: Moment | undefined;
    /**
     * @param amountOfTime You should probably only specify the time if this is the beginning of a timeline
     */
    constructor(amountOfTime: game_seconds | null = null) {
        this.amountOfTime = amountOfTime;
    }
    setTime(amountOfTime: game_seconds, relativeTo: Moment) {
        defer();
        if (this.amountOfTime !== null) {
            throw new Error("Time of moment has already been set");
        }
        this.amountOfTime = amountOfTime;
        this.relativeOtherMoment = relativeTo;
    }
    getTime(): game_seconds {
        if (!this.cachedActualTimeCalculation) {
            this.calculateTime();
        }
        return this.cachedActualTimeCalculation as game_seconds;
    }
    private calculateTime() {
        if (this.amountOfTime === null) {
            throw new Error("Time of moment has not been set");
        }
        this.cachedActualTimeCalculation = this.amountOfTime;
        if (this.relativeOtherMoment) {
            this.cachedActualTimeCalculation += this.relativeOtherMoment.getTime();
        }
    }
}
