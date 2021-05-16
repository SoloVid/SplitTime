namespace splitTime {
    export class Vector3D {
        x: number
        y: number
        z: number

        constructor(x: number = 0, y: number = 0, z: number = 0) {
            this.x = x
            this.y = y
            this.z = z
        }

        get magnitude(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
        }

        times(scalar: number): Vector3D {
            return new Vector3D(
                this.x * scalar,
                this.y * scalar,
                this.z * scalar
            )
        }

        plus(otherVector: Vector3D): Vector3D {
            return new Vector3D(
                this.x + otherVector.x,
                this.y + otherVector.y,
                this.z + otherVector.z
            )
        }

        dot(otherVector: Vector3D): number {
            return this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z
        }

        cross(otherVector: Vector3D): Vector3D {
            return new Vector3D(
                this.y * otherVector.z - this.z * otherVector.y,
                this.z * otherVector.x - this.x * otherVector.z,
                this.x * otherVector.y - this.y * otherVector.x
            )
        }
    }
}
