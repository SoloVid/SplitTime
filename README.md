# SplitTime Engine
JavaScript Game Engine for SoloVid's [Maven](http://solovid.net/maven)

What makes this engine unique is the way it handles time. Time is ever moving forward along a fixed-length timeline, but this timeline is segmented into asynchronous regional timelines. The overworld serves as a hub for all of the regions and also has its own timeline. Time is segmented into hour-long periods which represent one move in the overworld and an hour of real time for each region occupied by some subset of the player-controlled party members. A timeline has events which occur at specified points.

## Development Environment
Make sure you have [Nodejs](http://nodejs.org/download/).

From the command line, run the following commands to setup development dependencies (including GruntJS):
```sh
npm install
//or on Mac/Linux: sudo npm install
```

Grunt more-or-less serves as the compiler in the SplitTime environment. There are two basic Grunt commands to be familiar with for building the engine:
```sh
grunt build //build the engine
grunt spin //build the engine and watch for changes
```
There are two associated Grunt commands for building projects:
```sh
grunt build:projectName //build the project where projectName is the name of the project folder within the projects directory
grunt spin:projectName //build the project and watch for changes
```
We recommend running the two spin tasks for the duration of each development session.

Although development ought to be possible without it, we also recommend using http-server. Using a local server allows a better simulation of the production environment and avoids some security hurdles of browsers accessing local files (I'm looking at you, Chrome).
To install http-server:
```sh
npm install http-server -g
//or on Mac/Linux: sudo npm install http-server -g
```
To run the server:
```sh
http-server
```
While the server is running, you may access files in your browser at [localhost:8080](http://localhost:8080).

## Project Structure
Projects are individual games that reside in separate directories within ``projects/``. All of the files specific to your game are to be located within this directory.

The directories within each project should be

- ``audio/``
    - ``music/`` for music (looping)
    - ``soundeffects/`` for sound effects (non-looping)
- ``src/`` for all JS files which will be compiled into one file with engine code
- ``dist/`` for Grunt-generated files
- ``images/`` for image assets
    - ``preloaded/`` for image assets that will be loaded into memory at engine startup
- ``levels/`` for level files

The launch point of the game should be some HTML file in the project home directory. This file should include ``<script src="dist/game.js"></script>`` and later call ``SplitTime.launch(startUpCallback, XRES, YRES);``. Note that all JS files in ``src/`` will be included within ``dist/static.js``. No ordering of project JS files should be assumed. (However, you may use ``dependsOn("path/to/script")`` to ensure that one script loads before another.) Currently, the body of the HTML file should be essentially empty.

Within the game, all resources should be referenced relative to their asset type directory as specified in the enumeration above.

## Distribution
All files in a project's home directory should be included in distribution with the exception of JS files within ``src/`` (since they are included in ``dist/static.js``).
