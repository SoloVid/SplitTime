import { assert } from "globals"
import { useMemo } from "preact/hooks"
import { makeStyleString } from "../preact-help"
import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { CollageHelper } from "./collage-helper"
import Montage from "./montage"

type CollageShowcaseProps = {
  style?: string
  collageEditHelper?: SharedStuff | undefined
  collageViewHelper: SharedStuffViewOnly
}

export default function CollageShowcase(props: CollageShowcaseProps) {
  const {
    collageEditHelper,
    collageViewHelper,
  } = props

  const collage = collageViewHelper.collage

  const widestMontageWidth = useMemo(() => {
    const width = collageViewHelper.realCollage.montages.reduce((maxWidth, m) => {
      const mWidth = m.getOverallArea().width
      return Math.max(maxWidth, mWidth)
    }, 0)
    return Math.max(width, 16)
  }, [collageViewHelper])

  const gridStyle = useMemo(() => {
    const styleMap = {
      display: "grid",
      "grid-template-columns": "repeat(auto-fill, minmax(" + widestMontageWidth + "px, 1fr))",
      "grid-gap": "0.5rem",
      "align-items": "center",
      "justify-items": "center"
    }
    return makeStyleString(styleMap)
  }, [widestMontageWidth])

  function createNewMontage(): void {
    const collageHelper = new CollageHelper(collage)
    const newMontage = collageHelper.newMontage()
    const newMontageIndex = collage.montages.length
    assert(!!collageEditHelper, "Collage editor should be defined for montage editing")
    collageEditHelper.setCollage((before) => ({
      ...before,
      montages: [...before.montages, newMontage]
    }))
    collageEditHelper.selectMontage(newMontageIndex, true)
  }

  return <div style={`${gridStyle};${props.style ?? ""}`}>
    {collage.montages.map((m, i) => (
      <Montage
        collageEditHelper={collageEditHelper}
        collageViewHelper={collageViewHelper}
        montageIndex={i}
        montage={m}
      />
    ))}
    {collageEditHelper && <div
      onMouseDown={(e) => { if (e.button === 0) createNewMontage() }}
      title="Add montage"
      style="text-align: center; cursor: pointer;"
    >
      <i className="fas fa-plus fa-2x"></i>
    </div>}
  </div>
}