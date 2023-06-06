
/**
 * 
 * @param preferencesZoom Zoom percentage. (100 is actual size)
 * @returns Scale multiplier. (1 is actual size)
 */
export function convertZoomToScale(preferencesZoom: number): number {
  return preferencesZoom / 100 / window.devicePixelRatio
}
