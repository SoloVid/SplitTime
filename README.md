# SplitTime Engine
JavaScript game engine for SoloVid's [Maven](http://www.solovid.com/games/maven)

The engine was named for the idea of how it would handle time. Time is ever moving forward along a fixed-length timeline, but this timeline is segmented into asynchronous regional timelines. The overworld serves as a hub for all of the regions and also has its own timeline. Time is segmented into periods which represent one move in the overworld and so much real time for each region occupied by some subset of the player-controlled party members. A timeline has events which occur at specified points.

However, this time system is not yet realized and may be scrapped. The real distinguisher currently for this engine is its 2.5D nature. Although graphics are all 2D, the game supports simple 3D physics rather than using the standard 2D layer approach.

## Development Environment
Make sure you have [Nodejs](http://nodejs.org/download/) installed.

Also make sure that [Grunt](https://gruntjs.com/) is installed (``npm install -g grunt-cli``).

From the command line, run the following commands to setup development dependencies:
```sh
npm install
```

### Building

To build the engine:
```sh
grunt build
```

To build a project (after building the engine):
```sh
grunt build:<projectName>
```

_In the previous command, `<projectName>` should be replaced with the name of the directory containing the game project as described in the Project Structure section below._

Or to build both:
```sh
grunt build build:<projectName>
```

### Running

Although development ought to be possible without it, we also recommend using http-server. Using a local server allows a better simulation of the production environment and avoids some security hurdles of browsers accessing local files (I'm looking at you, Chrome).
To install http-server:
```sh
npm install http-server -g
```
To run the server:
```sh
http-server
```
While the server is running, you may access files in your browser at [localhost:8080](http://localhost:8080).
You'll probably access your game at something like [localhost:8080/projects/projectName/](http://localhost:8080/projects/projectName/).

### Testing

To run tests in ``src/engine-test/`` (after building the engine):
```sh
grunt test
```

Or to build and run tests:
```sh
grunt build test
```

### Cleaning

To get a clean build, delete the ``build`` directory
(in engine or project), and run your desired build.

## Project Structure
Projects are individual games that reside in separate directories within ``projects/``. All of the files specific to your game are to be located within this directory.

The directories within each project should be

- ``audio/``
    - ``music/`` for music (looping)
    - ``fx/`` for sound effects (non-looping)
- ``src/`` for all TypeScript files which will be compiled into one file with engine code
- ``build/`` for Grunt-generated files
- ``images/`` for image assets
    - ``preloaded/`` for image assets that will be loaded into memory at engine startup
- ``levels/`` for level files

The launch point of the game should be some HTML file in the project home directory. This file should include ``<script src="dist/game.js"></script>`` and later call ``G.launch();`` as defined somewhere in the game's source files.

Note that all TS files in ``src/`` will be included within ``dist/game.js``. No ordering of project JS files should be assumed. (However, you may use ``defer(() => { ... })`` to ensure that some code gets run after all definitions.)

Within the game, all resources should be referenced relative to their asset type directory as specified in the enumeration above.

## Distribution
All files in a project's home ``dist/`` directory should be served in the production environment.

## Editing Levels
Level files should be saved in a project's ``levels/`` directory, but levels are edited from the SplitTime repository.
After building the project, launch ``levelEditor.html`` in your browser (at the server-ed localhost address for best results), and provide the name of your project's directory.

Since this document is not meant to be an authoritative source for the editor's interface, we'll assume you can figure out how to use it from that point. Do note, though, that you will need to manually put the downloaded level file back into your project's ``levels/`` directory after you are done editing the level.
