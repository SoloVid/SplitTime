namespace splitTime.assets {
    const MUSIC_DIR = "music/"
    const SOUND_EFFECT_DIR = "fx/"
    const FADE_DURATION_MS = 2000

    class HowlContainer {
        howl: Howl | null = null
        soundId: number | null = null
        isLoaded: boolean = false
        isPausing: boolean = false
        musicGroup: string
        constructor(
            public readonly relativePath: string,
            public readonly handle: string,
            public readonly isLooping: boolean
        ) {
            //Music files will be considered to be in the same group if the file names share the first 5 chars
            this.musicGroup = handle.substr(0, 5)
        }
    }

    /**
     * Audio loading considerations
     *
     * The current setup is that each audio file is loaded only once, when the play function
     * is called on it for the first time. Then the Howl object associated with that audio
     * file gets added to loadedSounds[handle] to be used later.
     *
     * Note: depending on the total number of audio files used in a project, it may be better to
     * load all the files at the start of the program.
     */
    export class Audio {
        constructor(private readonly root: string) {}

        private sounds: { [handle: string]: HowlContainer } = {}
        private currentBkgSound: HowlContainer | null = null

        private globalVolume = 1
        private globalMute = false

        registerMusic(relativePath: string, loop = true) {
            this.registerAudio(MUSIC_DIR + relativePath, relativePath, loop)
        }

        registerSoundEffect(relativePath: string, loop = false) {
            this.registerAudio(
                SOUND_EFFECT_DIR + relativePath,
                relativePath,
                loop
            )
        }

        private registerAudio(
            relativePath: string,
            handle: string,
            loopAudio: boolean
        ) {
            this.sounds[handle] = new HowlContainer(
                relativePath,
                handle,
                loopAudio
            )
        }

        /**
         * @desc plays specified audio
         * @param handle - the name of the audio file to be played (e.g. "dirge.mp3")
         * @param loop - specify true/false to override default loop setting for this audio
         * @param restartIfPlaying - Defaults to false.  Set to true if the audio should start over
         *                                if it's currently playing (this is for looping sounds, such as music)
         */
        play(handle: string, loop?: boolean, restartIfPlaying?: boolean) {
            if (!(handle in this.sounds)) {
                throw new Error("Sound " + handle + " is not recognized")
            }

            var sound = this.sounds[handle]
            var currentVolume
            var fadeIn = false

            //If not set, this will be set to the default for this audio file.
            loop = typeof loop !== "undefined" ? loop : sound.isLooping

            if (sound.howl) {
                if (restartIfPlaying && sound.soundId !== null) {
                    sound.howl.seek(0, sound.soundId)
                }
                if (loop) {
                    //Note: this assumes we only have one looping background track at a time.
                    fadeIn = this.crossFadeSimilar(sound)
                }
                if (sound.soundId !== null) {
                    sound.howl.play(sound.soundId)
                }
                if (fadeIn) {
                    currentVolume = sound.howl?.volume() || 0
                    sound.howl.fade(currentVolume, this.globalVolume, FADE_DURATION_MS)
                } else {
                    sound.howl.volume(this.globalVolume)
                }
            } else {
                //Set up the audio file to be used with howler.js API
                //(howler.js documentation: https://github.com/goldfire/howler.js#documentation )

                const startVolume = this.globalVolume

                const howl = new Howl({
                    src: this.root + "/" + sound.relativePath,
                    autoplay: false,
                    volume: startVolume,
                    loop: loop,
                    onload: () => {
                        sound.isLoaded = true
                        if (loop) {
                            //Note: this assumes we only have one looping background track at a time.
                            fadeIn = this.crossFadeSimilar(sound)
                        }

                        if (fadeIn) {
                            howl.volume(0)
                            howl.fade(startVolume, this.globalVolume, FADE_DURATION_MS)
                        }
                    },
                    onfade: () => {
                        currentVolume = howl.volume()
                        if (currentVolume == 0) {
                            if (sound.isPausing) {
                                howl.pause()
                                sound.isPausing = false
                            } else {
                                howl.stop()
                            }
                        }
                    }
                })
                sound.howl = howl
                sound.soundId = howl.play()
            }
        }

        //Cross-fade settings for similar background themes: start where we left off
        //Returns true if new sound is similar to the currently playing sound
        private crossFadeSimilar(sound: HowlContainer) {
            var similar = false
            if (
                typeof this.currentBkgSound !== "undefined" &&
                sound.musicGroup == this.currentBkgSound?.musicGroup
            ) {
                similar = true
                if (this.currentBkgSound?.howl && sound.howl) {
                    var timeOffset =
                        (this.currentBkgSound.howl.seek() as number) || 0
                    sound.howl.seek(timeOffset)
                }
            }
            this.currentBkgSound = sound
            return similar
        }

        //Pause current splitTime.audio
        pause() {
            for (var handle in this.sounds) {
                var sound = this.sounds[handle]
                if (sound.isLoaded && sound.howl?.playing()) {
                    var currentVolume = sound.howl.volume()
                    sound.howl.fade(currentVolume, 0, FADE_DURATION_MS)
                    //this will make it so that the audio will pause (rather than stopping)
                    //after the onfade event is triggered (after the fading is finished)
                    sound.isPausing = true
                }
            }
        }

        //Stop current splitTime.audio
        stop() {
            for (var handle in this.sounds) {
                var sound = this.sounds[handle]
                if (sound.isLoaded && sound.howl?.playing()) {
                    var currentVolume = sound.howl.volume()
                    sound.howl.fade(currentVolume, 0, FADE_DURATION_MS)
                }
            }
        }

        mute() {
            // TODO: mute new sounds too after this call
            this.globalMute = true
            for (const key in this.sounds) {
                this.sounds[key].howl?.mute(this.globalMute)
            }
        }

        unmute() {
            this.globalMute = false
            for (const key in this.sounds) {
                this.sounds[key].howl?.mute(this.globalMute)
            }
        }
    }
}
