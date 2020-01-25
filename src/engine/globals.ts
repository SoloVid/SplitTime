// Note: TypeScript can't enforce integers; so tread with caution
type int = number;

namespace G {
    // It is difficult to abstract assets away and still allow them to be useful
    // Avoid accessing this global when possible
    export var ASSETS: SplitTime.Assets;
    // This world object is a convenience for game code and should not be used in engine code
    export var WORLD: SplitTime.World;

    defer(() => {
        WORLD = new SplitTime.World();
    });
}
