module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        oconcat: {
            options: {
                separator: ';\n'
            },
            engine: {
                options: {
                    root: 'src/engine'
                },
                src: [
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
                    '<%= grunt.config("projectPath") %>src/**/*.js'],
                dest: '<%= grunt.config("projectPath") %>dist/game.js'//'dist/<%= pkg.name %>.js'
            }
        },
        clean: {
            renamer: {
                src: ['**/src/**/*.tjs']
            }
        },
        copy: {
            renamer: {
                files: [{
                    expand: true,
                    dot: true,
                    //dest: 'dist/',
                    src: [
                        '**/src/**/*.tjs'
                    ],
                    rename: function(dest, src) {
                        return src.replace('.tjs','.js');
                    }
                }]
            }
        },
        injector: {
            options: {
                addRootSlash: false
            },
            level_files: {
                options: {
                    templateString: '<?xml version="1.0" encoding="UTF-8"?>\n<stuff>\n\t<levels>\t\n</levels>\n\t<images>\n\t</images>\n\t<musics>\n\t</musics>\n\t<soundeffects>\n\t</soundeffects>\n</stuff>',
                    starttag: '<levels>',
                    endtag: '</levels>',
                    transform: function(filepath, index, length) {
                        return '\t<level>' + filepath + '</level>';
                    },
                    ignorePath: '<%= grunt.config("projectPath") %>levels/'
                },
                files: {
                    '<%= grunt.config("projectPath") %>master.xml': ['<%= grunt.config("projectPath") %>levels/**/*.xml']
                }
            },
            music_files: {
                options: {
                    starttag: '<musics>',
                    endtag: '</musics>',
                    transform: function(filepath, index, length) {
                        return '\t<music>' + filepath + '</music>';
                    },
                    ignorePath: '<%= grunt.config("projectPath") %>audio/music/'
                },
                files: {
                    '<%= grunt.config("projectPath") %>master.xml': ['<%= grunt.config("projectPath") %>audio/music/**/*.mp3']
                }
            },
            sound_effect_files: {
                options: {
                    starttag: '<soundeffects>',
                    endtag: '</soundeffects>',
                    transform: function(filepath, index, length) {
                        return '\t<soundeffect>' + filepath + '</soundeffect>';
                    },
                    ignorePath: '<%= grunt.config("projectPath") %>audio/soundeffects/'
                },
                files: {
                    '<%= grunt.config("projectPath") %>master.xml': ['<%= grunt.config("projectPath") %>audio/soundeffects/**/*.mp3']
                }
            },
            preloaded_image_files: {
                options: {
                    starttag: '<images>',
                    endtag: '</images>',
                    transform: function(filepath, index, length) {
                        return '\t<image>' + filepath + '</image>';
                    },
                    ignorePath: '<%= grunt.config("projectPath") %>images/preloaded/'
                },
                files: {
                    '<%= grunt.config("projectPath") %>master.xml': ['<%= grunt.config("projectPath") %>images/preloaded/**/*']
                }
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
        //    qunit: {
        //      files: ['test/**/*.html']
        //    },
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
                }
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
                    'project:<%= grunt.config("project") %>'
                ]
            },
            tscripts: {
                options: {
                    event: ['added']
                },
                files: ['**/src/**/*.tjs'],
                tasks: 'rename'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ordered-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-injector');

    grunt.registerTask('test', ['jshint'/*, 'qunit'*/]);
    grunt.registerTask('rename', ['copy:renamer', 'clean:renamer']);
    grunt.registerTask('default', ['jshint:engine', 'oconcat:engine', 'watch:engine']);
    // grunt.registerTask('default', 'Default', function(param) {
    //     if(param) {
    //         grunt.task.run('project:' + param);
    //         return;
    //     }
    //     grunt.task.run(['jshint:engine', 'oconcat:engine', 'uglify', 'watch:engine']);
    // });

    grunt.registerTask('spin', 'Handle Grunt tasks for a project with watch', function(projectName) {
        if(!projectName) {
            return;
        }
        grunt.config("project", projectName);
        grunt.config("projectPath", "projects/" + projectName + "/");
        grunt.task.run(['project:' + projectName, 'watch:project']);
    });

    grunt.registerTask('project', 'Handle Grunt tasks for a project without watch', function(projectName) {
        if(!projectName) {
            return;
        }
        grunt.config("project", projectName);
        grunt.config("projectPath", "projects/" + projectName + "/");
        grunt.task.run(['jshint:project', 'oconcat:project', 'injector']);
        if(grunt.option('min')) {
            grunt.task.run('uglify:project');
        }
    });
};
