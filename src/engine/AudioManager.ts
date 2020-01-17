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
namespace SplitTime.audio {
    var AUDIO_ROOT: string;
    defer(() => {
        AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
    });
    var MUSIC_DIR = "music/";
    var SOUND_EFFECT_DIR = "fx/";
    var FADE_DURATION_MS = 2000;

    class HowlContainer {
        howl: Howl | null = null;
        soundId: any;
        isLoaded: boolean = false;
        isPausing: boolean = false;
        musicGroup: string;
        constructor(public readonly relativePath: string, public readonly handle: string, public readonly isLooping: boolean) {
            //Music files will be considered to be in the same group if the file names share the first 5 chars
            this.musicGroup = handle.substr(0, 5);
        }
    }
    
    var sounds: { [handle: string]: HowlContainer } = {};
    var currentBkgSound: HowlContainer;
    
    export var globalVolume = 1;
    
    
    export function registerMusic(relativePath: string, loop = true) {
        registerAudio(MUSIC_DIR + relativePath, relativePath, loop);
    };
    
    export function registerSoundEffect(relativePath: string, loop = false) {
        registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath, loop);
    };
    
    function registerAudio(relativePath: string, handle: string, loopAudio: boolean) {
        sounds[handle] = new HowlContainer(relativePath, handle, loopAudio);
    }
    
    /**
    * @desc plays specified audio
    * @param handle - the name of the audio file to be played (e.g. "dirge.mp3")
    * @param loop - specify true/false to override default loop setting for this audio
    * @param restartIfPlaying - Defaults to false.  Set to true if the audio should start over
    *                                if it's currently playing (this is for looping sounds, such as music)
    */
    export function play(handle: string, loop?: boolean, restartIfPlaying?: boolean) {
        if(!(handle in sounds)) {
            throw new Error("Sound " + handle + " is not recognized");
        }

        var sound = sounds[handle];
        var soundID = sound.soundId;
        var currentVolume;
        var fadeIn = false;
        
        //If not set, this will be set to the default for this audio file.
        loop = typeof loop !== 'undefined' ?  loop : sound.isLooping;
        
        if(sound.howl){
            if(restartIfPlaying) {
                sound.howl.seek(0, sound.soundId);
            }
            if(loop){  //Note: this assumes we only have one looping background track at a time.
                fadeIn = crossFadeSimilar(sound);
            }
            sound.howl.play(soundID);
            if(fadeIn){
                currentVolume = sound.howl?.volume() || 0;
                sound.howl.fade(currentVolume, 1, FADE_DURATION_MS);
            } else {
                sound.howl.volume(1);
            }
        } else {
            //Set up the audio file to be used with howler.js API 
            //(howler.js documentation: https://github.com/goldfire/howler.js#documentation )
            
            var startVolume = 1;
            
            const howl = new Howl({
                src: AUDIO_ROOT + sound.relativePath,
                autoplay: false,
                volume: startVolume,
                loop: loop,
                onload: function(){
                    sound.isLoaded = true;
                    if(loop){  //Note: this assumes we only have one looping background track at a time.
                        fadeIn = crossFadeSimilar(sound);
                    }
                    
                    if(fadeIn){
                        howl.volume(0);
                        howl.fade(startVolume, 1, FADE_DURATION_MS);
                    }
                },
                onfade: function(){
                    currentVolume = howl.volume();
                    if(currentVolume == 0){
                        if(sound.isPausing) {
                            howl.pause();
                            sound.isPausing = false;
                        } else {
                            howl.stop();
                        }
                    } 
                }
            });
            sound.howl = howl;
            soundID = howl.play();
        }
    };
    
    //Cross-fade settings for similar background themes: start where we left off
    //Returns true if new sound is similar to the currently playing sound
    function crossFadeSimilar(sound: HowlContainer) {
        var similar = false;
        if(typeof currentBkgSound !== 'undefined' && sound.musicGroup == currentBkgSound.musicGroup){
            similar = true;
            var timeOffset = currentBkgSound.howl?.seek() as number || 0;
            sound.howl?.seek(timeOffset);
        }
        currentBkgSound = sound;
        return similar;
    }
    
    //Pause current SplitTime.audio
    export function pause() {
        for(var handle in sounds) {
            var sound = sounds[handle];
            if(sound.isLoaded && sound.howl?.playing()){
                var currentVolume = sound.howl.volume();
                sound.howl.fade(currentVolume, 0, FADE_DURATION_MS);
                //this will make it so that the audio will pause (rather than stopping)
                //after the onfade event is triggered (after the fading is finished)
                sound.isPausing = true;
            }
        }
    };
    
    //Stop current SplitTime.audio
    export function stop() {
        for(var handle in sounds) {
            var sound = sounds[handle];
            if(sound.isLoaded && sound.howl?.playing()){
                var currentVolume = sound.howl.volume();
                sound.howl.fade(currentVolume, 0, FADE_DURATION_MS);
            } 
        }
    };
}
