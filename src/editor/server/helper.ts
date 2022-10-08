import { Config } from "./config"
import { PathHelper } from "./path-helper"

export class Helper {
    public readonly pathHelper: PathHelper

    constructor(public readonly config: Config) {
        this.pathHelper = new PathHelper(config)
    }
}
