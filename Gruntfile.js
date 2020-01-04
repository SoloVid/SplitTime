var path = require("path");

module.exports = function(grunt) {

    var LEVEL_DIRECTORY = "levels/";
    var PRELOADED_IMAGE_DIRECTORY = "images/preloaded/";
    var AUDIO_DIRECTORY = "audio/";
    var MUSIC_DIRECTORY = AUDIO_DIRECTORY + "music/";
    var SOUND_EFFECT_DIRECTORY = AUDIO_DIRECTORY + "fx/";
    var TASK_DATA_GEN = 'generate-data-js';
    var TASK_DECL_GEN = 'generate-index-d-ts';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            options: {
                tsCacheDir: 'build/.tscache'
            },
            engine: {
                tsconfig: 'tsconfig.json',
                options: {
                    rootDir: 'src'
                }
            },
            project: {
                tsconfig: '<%= grunt.config("projectPath") %>tsconfig.json',
                options: {
                    rootDir: '<%= grunt.config("projectPath") %>src'
                }
            }
        },
        concat: {
            options: {
                separator: ';\n',
                sourceMap: true
            },
            engine: {
                src: [
                    'node_modules/howler/dist/howler.min.js',
                    'build/tsjs/defer.def.js',
                    'build/tsjs/engine/**/*.js'
                ],
                dest: 'build/engine.js'
            },
            project: {
                src: [
                    'build/engine.js',
                    '<%= grunt.config("projectPath") %>build/tsjs/**/*.js',
                    '<%= grunt.config("projectPath") %>build/generated/**/*.js',
                    'build/tsjs/defer.run.js'
                ],
                dest: '<%= grunt.config("projectPath") %>dist/game.js'//'dist/<%= pkg.name %>.js'
            }
        },
        sync: {
            project: {
                files: [{
                    cwd: '<%= grunt.config("projectPath") %>',
                    src: [
                        'images/**',
                        'audio/**'
                    ],
                    dest: '<%= grunt.config("projectPath") %>dist'
                }],
                ignoreInDest: 'game.js',
                updateAndDelete: true,
                verbose: true // Display log messages when copying files
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n;var SplitTime = (function() {\n',
                footer: '\nreturn SplitTime;\n} ());'
            },
            project: {
                files: {
                    '<%= grunt.config("projectPath") %>dist/game.min.js': ['<%= grunt.config("projectPath") %>dist/game.js']
                }
            }
        },
        jshint: {
            options: {
                // options here to override JSHint defaults
                // '-W061': true, //ignore "eval can be harmful"
                // '-W054': true, //ignore "the Function constructor is a form of eval"
                // '-W069': true, //ignore dot operator preference over brackets
                globals: {
                    jQuery: true,
                    console: true,
                    document: true,
                    SLVD: true,
                    SplitTime: true
                },
                reporterOutput: ""
            },
            default: ['Gruntfile.js', 'src/editor/**/*.js'],
        }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-sync');

    grunt.registerTask('build', 'Build game project or just engine', function(projectName) {
        if(!projectName) {
            grunt.task.run(['ts:engine', TASK_DECL_GEN, 'concat:engine']);
        }
        else {
            grunt.config("project", projectName);
            grunt.config("projectPath", "projects/" + projectName + "/");
            grunt.task.run(['ts:project', TASK_DATA_GEN + ":" + projectName, 'concat:project', 'sync:project']);
            if(grunt.option('min')) {
                grunt.task.run('uglify:project');
            }
        }
    });

    function join() {
        var args = [];
        for(var i = 0; i < arguments.length; i++) {
            args.push(arguments[i] || "");
        }
        return path.join.apply(path, args).replace(/\\/, "/");
    }

    grunt.registerTask(TASK_DATA_GEN, 'Construct JS of assets', function(projectName) {
        grunt.log.writeln("Generating JSON for " + projectName);
        var projectRoot = "projects/" + projectName + "/";
        var gameData = {
            levels: [],
            preloadedImageFiles: [],
            musicFiles: [],
            soundEffectFiles: []
        };
        grunt.file.recurse(join(projectRoot, LEVEL_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            if(/\.json$/.test(fileName)) {
                grunt.verbose.writeln("Reading " + fileName);
                var fileData = grunt.file.readJSON(absPath);
                fileData.fileName = join(subDir, fileName);
                gameData.levels.push(fileData);
            } else {
                grunt.warn("Non-JSON file found in levels directory: " + fileName);
            }
        });
        grunt.file.recurse(path.join(projectRoot, PRELOADED_IMAGE_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.preloadedImageFiles.push(join(subDir, fileName));
        });
        grunt.file.recurse(path.join(projectRoot, MUSIC_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.musicFiles.push(join(subDir, fileName));
        });
        grunt.file.recurse(path.join(projectRoot, SOUND_EFFECT_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.soundEffectFiles.push(join(subDir, fileName));
        });

        var dataFileContents = "SplitTime._GAME_DATA = " + JSON.stringify(gameData) + ";";
        grunt.verbose.writeln("Writing data JS file");
        grunt.file.write(path.join(projectRoot, "build/generated/data.js"), dataFileContents);
    });

    grunt.registerTask(TASK_DECL_GEN, 'Create index.d.ts for SplitTime .d.ts files', function() {
        grunt.log.writeln("Generating index.d.ts for SplitTime");
        var declRefs = [];
        grunt.file.recurse("build/@types/SplitTime/", function(absPath, rootDir, subDir, fileName) {
            if(/index\.d\.ts$/.test(fileName)) {
                // Skip index.d.ts
            } else if(/\.d\.ts$/.test(fileName)) {
                grunt.verbose.writeln("Detected " + fileName);
                var filePath = join(subDir, fileName).replace("\\", "/");
                declRefs.push('/// <reference path="./' + filePath + '" />');
            } else {
                // Skip non-definition files
            }
        });

        var indexFileContents = declRefs.join("\n");
        grunt.verbose.writeln("Writing index.d.ts file");
        grunt.file.write("build/@types/SplitTime/index.d.ts", indexFileContents);
    });
};
