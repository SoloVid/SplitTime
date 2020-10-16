/// <reference path="deps.d.ts" />

namespace splitTime {
    export class NodeLibs {
        readonly fs: typeof _dependencies.fs = require("fs")
        readonly fsPromises: typeof _dependencies.fsPromises = require("fs").promises
        readonly path: typeof _dependencies.path = require("path")
    }
}
