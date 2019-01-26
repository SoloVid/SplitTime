var path = require("path");

module.exports = function(grunt) {

    var LEVEL_DIRECTORY = "levels/";
    var PRELOADED_IMAGE_DIRECTORY = "images/preloaded/";
    var AUDIO_DIRECTORY = "audio/";
    var MUSIC_DIRECTORY = AUDIO_DIRECTORY + "music/";
    var SOUND_EFFECT_DIRECTORY = AUDIO_DIRECTORY + "soundeffects/";
    var TEMP_DIRECTORY = "tmp/";
    var TEMP_SOURCE_DIRECTORY = TEMP_DIRECTORY + "src/";
    var DATA_SCRIPT = TEMP_SOURCE_DIRECTORY + "data.js";
    var TASK_DATA_GEN = 'generate-data-js';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        oconcat: {
            options: {
                separator: ';\n',
                process: function(src, filepath) {
                    return '(function() {\n' + src + '\n} ());';
                }
            },
            engine: {
                options: {
                    root: 'src/engine'
                },
                src: [
                    'node_modules/howler/dist/howler.min.js',
                    'src/globals.js', //first in file to avoid null pointers
                    'src/engine/**/*.js'
                ],
                dest: 'dist/engine.js'
            },
            project: {
                options: {
                    root: '<%= grunt.config("projectPath") %>src'
                },
                src: [
                    'dist/engine.js',
                    '<%= grunt.config("projectPath") %>src/**/*.js',
                    '<%= grunt.config("projectPath") %>' + TEMP_SOURCE_DIRECTORY + "**/*.js"
                ],
                dest: '<%= grunt.config("projectPath") %>dist/game.js'//'dist/<%= pkg.name %>.js'
            }
        },
        sync: {
            project: {
                files: [{
                    cwd: '<%= grunt.config("projectPath") %>',
                    src: [
                        // 'levels/**'
                        // 'projects/maven/levels/**'
                        'images/**',
                        'audio/**'
                        // '<%= grunt.config("projectPath") %>images/**',
                        // '<%= grunt.config("projectPath") %>audio/**'
                        // '!**/*.txt' /* but exclude txt files */
                    ],
                    dest: '<%= grunt.config("projectPath") %>dist'
                    // dest: '<%= grunt.config("projectPath") %>dist',
                }],
                ignoreInDest: 'game.js',
                updateAndDelete: true,
                // pretend: true, // Don't do any IO. Before you run the task with `updateAndDelete` PLEASE MAKE SURE it doesn't remove too much.
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
                '-W061': true, //ignore "eval can be harmful"
                '-W054': true, //ignore "the Function constructor is a form of eval"
                '-W069': true, //ignore dot operator preference over brackets
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true,
                    SLVD: true,
                    SplitTime: true,
                    t: true
                },
                reporterOutput: ""
            },
            engine: ['Gruntfile.js', 'src/editor/**/*.js', 'src/globals.js', 'src/engine/**/*.js'],
            project: ['<%= grunt.config("projectPath") %>src/**/*.js']
        },
        watch: {
            options: {
                atBegin: true
            },
            engine: {
                files: ['<%= jshint.engine %>'],
                tasks: ['jshint:engine', 'oconcat:engine']
            },
            project: {
                files: ['dist/engine.js', '<%= grunt.config("projectPath") %>src/**/*.js', '<%= grunt.config("projectPath") %>/levels/**/*.xml'],
                tasks: [
                    'build:<%= grunt.config("project") %>'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ordered-concat');
    grunt.loadNpmTasks('grunt-sync');

    grunt.registerTask('default', 'spin');

    grunt.registerTask('spin', 'Handle Grunt tasks for a project with watch', function(projectName) {
        if(!projectName) {
            grunt.task.run(['jshint:engine', 'oconcat:engine', 'watch:engine']);
        }
        else {
            grunt.config("project", projectName);
            grunt.config("projectPath", "projects/" + projectName + "/");
            grunt.task.run(['build:' + projectName, 'watch:project']);
        }
    });

    grunt.registerTask('build', 'Handle Grunt tasks for a project without watch', function(projectName) {
        if(!projectName) {
            grunt.task.run(['jshint:engine', 'oconcat:engine']);
        }
        else {
            grunt.config("project", projectName);
            grunt.config("projectPath", "projects/" + projectName + "/");
            grunt.task.run(['jshint:project', TASK_DATA_GEN + ":" + projectName, 'oconcat:project', 'sync:project']);
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
        grunt.file.write(path.join(projectRoot, DATA_SCRIPT), dataFileContents);
    });
};
