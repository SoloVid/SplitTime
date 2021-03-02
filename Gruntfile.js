var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");

module.exports = function(grunt) {


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n;var splitTime = (function() {\n',
                footer: '\nreturn splitTime;\n} ());'
            },
            project: {
                files: {
                    '<%= grunt.config("projectPath") %>dist/game.min.js': ['<%= grunt.config("projectPath") %>dist/game.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    // sync-glob might be a good non-Grunt alternative
    // https://github.com/AndyOGo/node-sync-glob/blob/HEAD/API.md
    // https://www.npmjs.com/package/sync-glob
    // grunt.loadNpmTasks('grunt-sync');

    // function syncDirs(projectPath) {
    //     console.log("syncing...")
    //     var config = {
    //         type: "copy",
    //         deleteOrphaned: true
    //     }
    //     syncDirectory(path.resolve(path.join(projectPath, "images")), path.resolve(path.join(projectPath, "dist", "images")), config);
    //     syncDirectory(path.resolve(path.join(projectPath, "audio")), path.resolve(path.join(projectPath, "dist", "audio")), config);
    //     console.log("done sync")
    // }




    function getRoot() {
        return path.resolve(path.dirname((module).filename), '.');
    }

    function getPathInNodeModules(pathPart) {
        var ownRoot = getRoot();
        var binSub = path.join('node_modules', pathPart);
        return path.join(ownRoot, binSub);
    }


};
