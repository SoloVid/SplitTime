import Concat from "concat-with-sourcemaps"
import * as convertSourceMap from "convert-source-map"
import * as fsOrig from "fs"
import * as glob from "glob"
import * as path from "path"
const fs = fsOrig.promises

export async function runAfter(callback: () => PromiseLike<void>, ...promises: PromiseLike<void>[]): Promise<void> {
    await Promise.all(promises)
    await callback()
}

    export async function concatFilesWithSourceMaps(filePatterns: string[], outputFilePath: string): Promise<void> {
        var outputFileDir = path.dirname(outputFilePath);
        var outputFileName = path.basename(outputFilePath);
        let files: string[] = []
        for (const pattern of filePatterns) {
            files = files.concat(glob.sync(pattern))
        }
        const concat = new Concat(true, outputFileName, '\n\n;\n\n');
        const calls = await Promise.all(files.map(async (file) => {
            const fileInfo = await readFileWithSourceMap(file)
            let sourceMap: undefined | string = undefined
            if(fileInfo.sourceMap) {
                const jsonSourceMap = convertSourceMap.fromJSON(fileInfo.sourceMap).toObject()
                for(let i = 0; i < jsonSourceMap.sources.length; i++) {
                    jsonSourceMap.sources[i] = transposeRelativePath(jsonSourceMap.sources[i], file, outputFilePath);
                }
                sourceMap = convertSourceMap.fromObject(jsonSourceMap).toJSON()
            }
            return () => concat.add(file, fileInfo.content, sourceMap)
        }))
        calls.forEach(c => c())
        var sourceMapFileName = outputFileName + ".map";
        concat.add(null, "//# sourceMappingURL=" + sourceMapFileName);
        var sourceMapPath = path.join(outputFileDir, sourceMapFileName);
        await Promise.all([
            fs.writeFile(outputFilePath, concat.content),
            fs.writeFile(sourceMapPath, concat.sourceMap)
        ])
    }

    async function readFileWithSourceMap(filePath: string) {
        const fileContents = await fs.readFile(filePath)
        const fileContentsString = fileContents.toString()
        var fileLines = fileContentsString.split("\n")
        var sourceMap = ""
        const fileLinesWithoutSourceMaps = await Promise.all(
            fileLines.map(
                async (line) => {
                    var matches = line.match(/\/\/# sourceMappingURL=(.+\.js\.map)/);
                    if(matches) {
                        var relSourceMapPath = matches[1]
                        var absSourceMapPath = path.join(path.resolve(path.dirname(filePath)),
                            relSourceMapPath)
                        const sourceMapFile = await fs.readFile(absSourceMapPath)
                        sourceMap = sourceMapFile.toString()
                        return line.replace(/./g, "/")
                    } else {
                        return line
                    }
                }
            )
        )
        return {
            content: fileLinesWithoutSourceMaps.join("\n"),
            sourceMap: sourceMap
        };
    }

    export function countSlashesInPath(path: string) {
        return (path.replace(/\\\\?/g, "/").match(/\//g) || []).length;
    }

    function transposeRelativePath(originalRelativePath: string, originalReferenceFile: string, targetReferenceFile: string): string {
        var absoluteFilePath = path.resolve(path.dirname(originalReferenceFile), originalRelativePath);
        var targetDir = path.resolve(path.dirname(targetReferenceFile));
        return path.relative(targetDir, absoluteFilePath).replace(/\\\\?/g, "/");
    }
