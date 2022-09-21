import { int, Coordinates3D } from "../splitTime";
export enum ReturnCode {
    EXIT_EARLY,
    CONTINUE
}
export function forEachPoint(x0: int, y0: int, x1: int, y1: int, callback: (x: int, y: int) => void | ReturnCode, includeLast: boolean = false) {
    forEach3DPoint(new Coordinates3D(x0, y0), new Coordinates3D(x1, y1), p => callback(p.x, p.y), includeLast);
}
export function forEach3DPoint(a: Coordinates3D, b: Coordinates3D, callback: (p: Coordinates3D) => void | ReturnCode, includeLast: boolean = false) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const adz = Math.abs(dz);
    const dx1 = dx > 0 ? 1 : -1;
    const dy1 = dy > 0 ? 1 : -1;
    const dz1 = dz > 0 ? 1 : -1;
    const numPoints = Math.max(adx, ady, adz);
    let x = a.x;
    let y = a.y;
    let z = a.z;
    let eX = -numPoints;
    let eY = -numPoints;
    let eZ = -numPoints;
    for (let i = 0; i < numPoints; i++) {
        if (callback(new Coordinates3D(x, y, z)) === ReturnCode.EXIT_EARLY) {
            return;
        }
        eX += 2 * adx;
        if (eX > 0) {
            x += dx1;
            eX -= 2 * numPoints;
        }
        eY += 2 * ady;
        if (eY > 0) {
            y += dy1;
            eY -= 2 * numPoints;
        }
        eZ += 2 * adz;
        if (eZ > 0) {
            z += dz1;
            eZ -= 2 * numPoints;
        }
    }
    if (includeLast) {
        callback(new Coordinates3D(x, y, z));
    }
}
