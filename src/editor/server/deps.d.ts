export as namespace _dependencies;//from MAIN to MAIN didn't work, need reference

import * as _express from 'express'
import * as _fs from 'fs'
import * as _jquery from 'jquery'
import * as _path from 'path'

export const express: typeof _express
declare const fs: typeof _fs
declare const $: typeof _jquery
declare const path: typeof _path
