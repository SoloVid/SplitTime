import { useEffect, useMemo, useState } from "preact/hooks";
import { useJsonableMemo } from "./use-jsonable-memo";

type State = {
  imgSrc: string | null
  size: {width: number, height: number} | null
}

export function useImageSize(imgSrc: string | null) {
  const [state, setState] = useState<State>({imgSrc, size: null})
  useEffect(() => {
    setState({imgSrc, size: null})
    if (imgSrc === null) {
      return
    }
    const img = new Image()
    img.onload = () => {
      setState((before) => {
        if (before.imgSrc !== imgSrc) {
          return before
        }
        return {
          imgSrc,
          size: {
            width: img.width,
            height: img.height
          },
        }
      })
    }
    img.src = imgSrc
  }, [imgSrc])
  return state.size
}

export function useScaledImageSize(imgSrc: string | null, scale: number) {
  const imageSize = useImageSize(imgSrc)
  return useJsonableMemo(() => {
    if (imageSize === null) {
      return null
    }
    return {
      width: Math.round(imageSize.width * scale),
      height: Math.round(imageSize.height * scale),
    }
  }, [imageSize, scale])
}
