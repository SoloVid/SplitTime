// File helps resolve some of the incompatibility between
// out namespace-based project and Node module-based dependencies.
// Adapted from https://github.com/Microsoft/TypeScript/issues/17279#issuecomment-316228569
export as namespace _dependencies

import * as _express from 'express'
import * as _fs from 'fs'
import * as _path from 'path'

export const express: typeof _express
export const fs: typeof _fs
export const path: typeof _path
