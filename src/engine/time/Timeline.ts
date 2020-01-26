namespace SplitTime {
    export type game_seconds = number;
    export type game_ms = number;
    export type real_seconds = number;
    export type real_ms = number;

    export class Timeline {
        _timeInMilliseconds: game_ms;
        _timeAdvanceListeners: SLVD.RegisterCallbacks;
        _regions: SplitTime.Region[];
        _timelineSecondsPerRealSecond: game_seconds;
        clockSeconds: game_seconds = 0;
        clockMinutes: game_seconds = 0;
        clockHours: game_seconds = 0;
        constructor() {
            this._timeInMilliseconds = 0;
            this._timeAdvanceListeners = new SLVD.RegisterCallbacks();
            /**
            * @type {SplitTime.Region[]}
            */
            this._regions = [];
            
            this._timelineSecondsPerRealSecond = 1;
        };
        
        registerTimeAdvanceListener(listener: (delta: game_seconds) => any) {
            this._timeAdvanceListeners.register(listener);
        };
        
        addRegion(region: SplitTime.Region) {
            this._regions.push(region);
        };
        removeRegion(region: SplitTime.Region) {
            var regionIndex = this._regions.indexOf(region);
            if(regionIndex >= 0) {
                this._regions.splice(regionIndex, 1);
            } else if(SplitTime.debug.ENABLED) {
                SplitTime.Logger.warn("Attempted to remove region " + region.id + " from non-parent timeline");
            }
        };
        
        private static componentToAbsolute(day: number, hour: number, minute: number, second: number) {
            return day * 60 * 60 * 24 + hour * 60 * 60 + minute * 60 + second;
        };
        
        getTimeMs(): game_ms {
            return this._timeInMilliseconds;
        };
        
        advance(seconds: game_seconds) {
            this._timeInMilliseconds += Math.floor(seconds * 1000);
            this._timeAdvanceListeners.run(seconds);
            
            for(var i = 0; i < this._regions.length; i++) {
                this._regions[i].notifyTimeAdvance(seconds);
            }
        };
        
        notifyFrameUpdate(delta: real_seconds) {
            this.advance(delta * this._timelineSecondsPerRealSecond);
        };
        
        // renderClock(context: CanvasRenderingContext2D) {
        //     context.drawImage(SplitTime.image.get("clock.png"), SplitTime.SCREENX - 140, 0);
        //     context.lineWidth = 1;
        //     context.strokeStyle = "#DDDDDD";
        //     var hand = Math.PI / 2 - (2 * (this.clockSeconds / 60) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        //     context.lineWidth = 2;
        //     context.strokeStyle = "#000000";
        //     hand = Math.PI / 2 - (2 * (this.clockMinutes / 60) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        //     context.strokeStyle = "#EE0000";
        //     context.lineWidth = 3;
        //     hand = Math.PI / 2 - (2 * (this.clockHours / 12) * Math.PI);
        //     context.beginPath();
        //     context.moveTo(SplitTime.SCREENX - 70, 70);
        //     context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
        //     context.stroke();
        // };
    }

    export interface TimeNotified {
        /**
        * @param delta number of seconds passed (in game time) since last frame
        */
        notifyTimeAdvance(delta: game_seconds): void;
    }

    export namespace instanceOf {
        export function TimeNotified(obj: any): obj is TimeNotified {
            return typeof obj.notifyTimeAdvance === "function";
        }
    }    
}
