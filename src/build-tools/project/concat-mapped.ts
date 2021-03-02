import * as fsOrig from "fs"
import * as glob from "glob"
import { concatFilesWithSourceMaps, countSlashesInPath } from "../common/concat-mapped"
const fs = fsOrig.promises

export async function concatProjectSource(projectRoot: string): Promise<void> {
    const compiledSourceFiles = glob.sync(projectRoot + '/build/tsjs/**/*.js')
    // We're sorting by the number of slashes in the path ascending
    // so as to put the top-level directory files before the innermost directory files.
    var compiledSourceFilesSorted = compiledSourceFiles.sort(function(a, b) {
        var slashesInA = countSlashesInPath(a);
        var slashesInB = countSlashesInPath(b);
        return slashesInA - slashesInB;
    });
    const files = ([
        'build/engine.js',
        'build/tsjs/defer.def.js',
        projectRoot + '/build/generated/**/*.js',
        ]).concat(compiledSourceFilesSorted).concat([
        'build/tsjs/defer.run.js'
    ]);
    concatFilesWithSourceMaps(files, projectRoot + '/dist/game.js');
}
