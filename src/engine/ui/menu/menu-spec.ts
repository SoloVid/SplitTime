import { int } from "../../splitTime";
type menu_option_handler = () => void;
export class MenuSpec {
    point: {
        x: int;
        y: int;
        handler: menu_option_handler;
    }[] = [];
    background: string | null = null;
    cursor: string | null = null;
    addPoint(x: int, y: int, handler: menu_option_handler) {
        var index = this.point.length;
        this.point[index] = { x: x, y: y, handler: handler };
    }
}
