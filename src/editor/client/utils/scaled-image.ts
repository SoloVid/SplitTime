import { MutableRef, useMemo } from "preact/hooks"

export function useScaledImageDimensions($image: MutableRef<HTMLImageElement | null>, scale: number) {
  const imageDimensions = useMemo(() => {
    if (!$image.current) {
      return { x: 32, y: 32 }
    }
    return {
      x: $image.current.naturalWidth,
      y: $image.current.naturalHeight,
    }
  }, [$image.current])

  const scaledDimensions = useMemo(() => {
    return {
      x: Math.round(imageDimensions.x * scale),
      y: Math.round(imageDimensions.y * scale),
    }
  }, [imageDimensions.x, imageDimensions.y, scale])

  return scaledDimensions
}
