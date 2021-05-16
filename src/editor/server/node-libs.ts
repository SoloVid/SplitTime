/// <reference path="deps.d.ts" />

namespace splitTime {
    /**
     * Since it is awkward to directly reference Node packages
     * within the ecosystem of this engine, this class handles that for you.
     *
     * **This class can only be used in server-side context**
     */
    export class NodeLibs {
        private userErrorMessage = assert(__NODE__, "NodeLibs can only be used in Node context")
        readonly express: typeof _dependencies.express = require("express")
        readonly fs: typeof _dependencies.fs = require("fs")
        readonly fsPromises: typeof _dependencies.fsPromises = require("fs").promises
        readonly path: typeof _dependencies.path = require("path")
    }
}
