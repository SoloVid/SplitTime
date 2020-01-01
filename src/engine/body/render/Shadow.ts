namespace SplitTime.body {
    export class Shadow implements SplitTime.body.Drawable {
        realBody: Body;
        shadowBody: Body;
        minRadius: number;
        maxRadius: any;
        radius: any;
        constructor(body: SplitTime.Body) {
            this.realBody = body;
            this.shadowBody = new SplitTime.Body();
            this.shadowBody.drawable = this;
            this.shadowBody.baseLength = body.baseLength;
            this.shadowBody.height = 0;
            
            this.minRadius = 4;
            this.maxRadius = this.shadowBody.baseLength;
            this.radius = this.maxRadius;
        };
        opacity = 1;
        playerOcclusionFadeFactor = 0;
        
        getCanvasRequirements(x, y, z) {
            return new SplitTime.body.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.radius, this.radius);
        };
        
        /**
        * @param {CanvasRenderingContext2D} ctx
        */
        draw(ctx) {
            var
            // Radii of the white glow.
            innerRadius = 2,
            outerRadius = this.radius,
            // Radius of the entire circle.
            radius = this.radius;
            
            var gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, .7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.scale(1, 0.5);
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            
            ctx.fillStyle = gradient;
            ctx.fill();
        };
        
        notifyFrameUpdate(delta) {
            // Do nothing
        };
        
        prepareForRender() {
            this.shadowBody.put(null, this.realBody.x, this.realBody.y, this.realBody.z);
            var mover = new SplitTime.body.Mover(this.shadowBody);
            mover.level = this.realBody.level;
            var shadowFallInfo = mover.falling.calculateDrop(mover.level.highestLayerZ + 1000);
            this.shadowBody.setZ(shadowFallInfo.zBlocked);
            this.radius = (this.maxRadius - this.minRadius) / (0.05 * shadowFallInfo.distanceAllowed + 1) + this.minRadius;
        };
        cleanupAfterRender() {
            // Do nothing
        };
    }
}