# SLVDE
JavaScript Engine for SoloVid's [Maven](http://solovid.net/maven)

## Quick Start
To get a project running, download the project files. Make sure you have [Nodejs](http://nodejs.org/download/).

From the command line in the directory of the engine, run the following commands:
```sh
npm -g install grunt-cli
//or on Mac/Linux: sudo npm -g install grunt-cli
npm install
//or on Mac/Linux: sudo npm install
grunt
```

Grunt watch is an ongoing command which "compiles" your updated code and levels into the dist directory as it is updated. Be sure to run grunt before editing levels or running the engine.
Open the distMain.htm file to run the engine.

## Project Directory Structure
All of the files specific to your game are to be located in the files folder. 
In that folder, there is a very important file found at files/main/initialize.js. This file has a function called startUp which is the entry point of the game.
Also in the main folder is an XML file called master.xml which tells the engine what levels, music, sound effects (not looping), and system images to grab. 
This file should be managed by grunt.

Be sure to put all of the files in their respective folders:

- Audio files must be placed in files/audio (mp3s are encouraged).
    - Music files (looping) should be placed in files/audio/music and referred to in-game by their path relative to that directory.
    - Sound effect files (non-looping) should be placed in files/audio/soundeffects and referred to in-game by their path relative to that directory.
- Image files must be placed in files/images.
    - Images that are to be used in custom code or that should otherwise be loaded before the game starts should be placed in files/images/preloaded and referred to in-game by their path relative to that directory.
    - Images used in sprites can be put into the preloaded folder, but the engine may at some point incorporate optimizations which would be inhibited by such. Sprite images generally should be placed in files/images and referred to in-game by their path relative to that directory.
- Levels must must be placed in files/levels and referred to in-game by their name (not filename).
- Any custom code (events, sprite templates, actions, etc.) must be placed in files/code. N.B. All code in this folder will be concatenated by grunt into a single file dist/static.js along with some engine code. Therefore, all code files may be considered as a single, flattened file but not guaranteed to be in a specific folder. Function hoisting should be available across these files.

## Distribution
Once grunt has been run on a completed project, the distribution files required are:
- distMinMain.htm: the launch point of the game; may be renamed
- dist/Maven.js
- everything in files/ minus that in files/code/ and files/main/initialize.js (which are both incorporated into Maven.js)