import { join } from "../common/file-helper"

export const LEVEL_DIRECTORY = "levels"
export const COLLAGE_DIRECTORY = "collage"
export const IMAGE_DIRECTORY = "images"
export const PRELOADED_IMAGE_DIRECTORY = IMAGE_DIRECTORY + "/preloaded"
export const AUDIO_DIRECTORY = "audio"
export const MUSIC_DIRECTORY = AUDIO_DIRECTORY + "/music"
export const SOUND_EFFECT_DIRECTORY = AUDIO_DIRECTORY + "/fx"

export const buildDirectory = "build"
export const generatedDirectory = join(buildDirectory, "generated")
export const buildLogsDirectory = join(buildDirectory, "logs")

export const buildIdFile = join(buildDirectory, "build-id.txt")
export const buildStatusFile = join(buildDirectory, "build-status.txt")
