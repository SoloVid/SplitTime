# SplitTime Engine
TypeScript game engine for SoloVid's [Maven](http://www.solovid.com/games/maven)

The engine was named for the idea of how it would handle time. Levels can be subdivided into distinct timelines, and these timelines may advance at differing rates over time. A timeline has events which occur at specified points.

However, the real distinction of this engine is its 2.5D nature. Although graphics are all 2D, the game supports simple 3D physics rather than using the standard 2D layer approach.

## Development Environment
Make sure you have [Nodejs](http://nodejs.org/download/) installed.

From the command line, run the following commands to set up development dependencies:
```sh
npm install
```

If developing the engine and a game project in tandem,
run ``npm link`` in the directory of the engine (this repository)
and then run ``npm link splittime`` in the game project directory.

Alternatively, you can set your ``splittime`` dependency in your project to a local file:

```
"splittime": "file:<relative path to>/engine"
```

### TL;DR

Where the engine's at now, you're probably developing the engine alongside your project.

Open one terminal in the engine directory:

```
node build --watch --all
```

Open a different terminal in the game directory:

```
npx splittime dev --check
```

Go to [localhost:8080](http://localhost:8080).

*Alternatively* if you want the fastest experience with the least safety, leave off type-checking/tests:

```
# in engine directory
node build --watch
# in game directory
npx splittime dev
```

### Building

To build the engine:
```sh
node build --all
# or with just the fastest and necessary stuff:
# node build
```

_We're just running the ``build`` JS script in the root of this project._

To build the project (after building the engine), run ``splittime build`` (e.g. ``npx splittime build``).
Configure the npm ``build`` script to something like ``splittime build`` and the following command will execute the build:
```sh
npm run -s build
```

If you want editor (VS Code) support, ``tsconfig.json`` in project should look something like:
```json
{
  "extends": "splittime/tsconfig.project.json",
  "include": [
    "./src/**/*.ts"
  ]
}
```
_(This configuration file should not be expected to affect the actual build with ``splittime build``.)_

### Running

The SplitTime engine ships with a development server (available after building the engine):
```sh
npx splittime dev
```
While the server is running, you may access files in your browser at [localhost:8080](http://localhost:8080).
You'll be able to play-test your game at [localhost:8080/run](http://localhost:8080/run).

### Testing

To run tests in ``src/engine-test/``:
```sh
npm test
```

<!--
TODO: This section is out of date. Update or remove.
Alternatively, you can run these tests in the browser at [localhost:8080/test-runner.html](http://localhost:8080/test-runner.html) through the development server after building the engine.
-->

### Cleaning

To get a clean build, delete the ``lib`` (engine) or ``.build`` (game project)
directory, and run your desired build.

## Project Structure
Projects are individual games that reside in separate directories within ``projects/``.
All of the files specific to your game are to be located within this directory.

Here's a little bit about different files within each project:

- ``*.ts*`` - TypeScript files which will be compiled into one file with engine code
- ``.build/`` - build-generated files
- ``*.mp3`` - music (looping) and sound effects (non-looping)
- ``*.png``/``*.jpg`` - image assets
- ``*.clg.yml`` - collage files
- ``*.lvl.yml`` - level files

Within the game code, all resources should be referenced relative to the project root directory.

The launch point of the game should be provided via call to `exposeLaunchPoint()` somewhere in the game's source files:

```ts
import { exposeLaunchPoint, load } from "splittime"

exposeLaunchPoint(async (attachId) => {
  ...
  view.attach(attachId)
  await load(perspective, ASSETS)
  main.start()
  ...
})
```

Note that all TS files will be included within ``dist/game.js``.

## Distribution
All files in a project's home ``dist/`` directory should be served in the production environment.

## Editing Collages/Levels
Level files should be saved with the file extension ``.lvl.yml``.
Collage files should be saved with the file extension ``.clg.yml``.
Both of these types can be edited via the SplitTime development server.

After building the project and starting the development server, launch [localhost:8080](http://localhost:8080) in your browser to open the development environment.

Since this document is not meant to be an authoritative source for the editor's interface, we'll assume you can figure out how to use it from that point.
