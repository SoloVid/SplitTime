namespace splitTime.math {
    export class Rect {
        private _x: number = 0
        private _y: number = 0
        private _width: number = 0
        private _height: number = 0

        private constructor() {}

        public static make(x: number, y: number, width: number, height: number): Rect {
            const rect = new Rect()
            rect.x = x
            rect.y = y
            rect.width = width
            rect.height = height
            return rect
        }

        get x(): number {
            return this._x
        }
        set x(val: number) {
            this._x = val
        }
        
        get y(): number {
            return this._y
        }
        set y(val: number) {
            this._y = val
        }
        
        get width(): number {
            return this._width
        }
        set width(val: number) {
            this._width = val
        }
        
        get height(): number {
            return this._height
        }
        set height(val: number) {
            this._height = val
        }

        get x2(): number {
            return this._x + this._width
        }
        set x2(val: number) {
            this._width = val - this._x
        }

        get y2(): number {
            return this._y + this._height
        }
        set y2(val: number) {
            this._height = val - this._y
        }
    }
}