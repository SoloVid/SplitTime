namespace SplitTime {
    export class Timeline {
        _timeInMilliseconds: number;
        _timeAdvanceListeners: SLVD.RegisterCallbacks;
        _regions: SplitTime.Region[];
        _timelineSecondsPerRealSecond: number;
        clockSeconds: number = 0;
        clockMinutes: number = 0;
        clockHours: number = 0;
        constructor() {
            this._timeInMilliseconds = 0;
            this._timeAdvanceListeners = new SLVD.RegisterCallbacks();
            /**
            * @type {SplitTime.Region[]}
            */
            this._regions = [];
            
            this._timelineSecondsPerRealSecond = 1;
        };
        
        static get(timeId: string) {
            if(!timeMap[timeId]) {
                timeMap[timeId] = new SplitTime.Timeline();
            }
            return timeMap[timeId];
        };
        
        /**
        * Get the time object currently in play.
        */
        static getCurrent(): SplitTime.Timeline {
            var currentLevel = SplitTime.Level.getCurrent();
            return currentLevel.getRegion().getTimeline();
        };
        
        static getDefault(): SplitTime.Timeline {
            return defaultTime;
        };
        
        registerTimeAdvanceListener(listener: (delta: number) => any) {
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
        
        static componentToAbsolute(day: number, hour: number, minute: number, second: number) {
            return day * 60 * 60 * 24 + hour * 60 * 60 + minute * 60 + second;
        };
        
        getTimeMs() {
            return this._timeInMilliseconds;
        };
        
        advance(seconds: number) {
            this._timeInMilliseconds += Math.floor(seconds * 1000);
            this._timeAdvanceListeners.run(seconds);
            
            for(var i = 0; i < this._regions.length; i++) {
                this._regions[i].notifyTimeAdvance(seconds);
            }
        };
        
        notifyFrameUpdate(delta: number) {
            this.advance(delta * this._timelineSecondsPerRealSecond);
        };
        
        
        
        
        renderClock(context: CanvasRenderingContext2D) {
            context.drawImage(SplitTime.image.get("clock.png"), SplitTime.SCREENX - 140, 0);
            context.lineWidth = 1;
            context.strokeStyle = "#DDDDDD";
            var hand = Math.PI / 2 - (2 * (this.clockSeconds / 60) * Math.PI);
            context.beginPath();
            context.moveTo(SplitTime.SCREENX - 70, 70);
            context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
            context.stroke();
            context.lineWidth = 2;
            context.strokeStyle = "#000000";
            hand = Math.PI / 2 - (2 * (this.clockMinutes / 60) * Math.PI);
            context.beginPath();
            context.moveTo(SplitTime.SCREENX - 70, 70);
            context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
            context.stroke();
            context.strokeStyle = "#EE0000";
            context.lineWidth = 3;
            hand = Math.PI / 2 - (2 * (this.clockHours / 12) * Math.PI);
            context.beginPath();
            context.moveTo(SplitTime.SCREENX - 70, 70);
            context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
            context.stroke();
        };
    }
    
    const timeMap: {[id: string]: Timeline} = {};
    const defaultTime = new SplitTime.Timeline();
    
    export interface TimeNotified {
        /**
        * @param delta number of seconds passed (in game time) since last frame
        */
        notifyTimeAdvance(delta: number): void;
    }

    export namespace instanceOf {
        export function TimeNotified(obj: any): obj is TimeNotified {
            return typeof obj.notifyTimeAdvance === "function";
        }
    }    
}
