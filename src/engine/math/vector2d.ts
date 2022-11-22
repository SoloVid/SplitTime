export class Vector2D {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
    static angular(angle: number, magnitude: number) {
        return new Vector2D(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
    }
    get angle(): number {
        return Math.atan2(this.y, this.x);
    }
    get angleSafe(): number {
        return this.x === 0 ? Math.PI / 2 : this.angle;
    }
    get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    times(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    plus(otherVector: Vector2D): Vector2D {
        return new Vector2D(this.x + otherVector.x, this.y + otherVector.y);
    }
    dot(otherVector: Vector2D): number {
        return this.x * otherVector.x + this.y * otherVector.y;
    }
    rotate(radians: number): Vector2D {
        return new Vector2D(Math.cos(radians) * this.x - Math.sin(radians) * this.y, Math.sin(radians) * this.x + Math.cos(radians) * this.y);
    }
}
