import { Collage } from "../../graphics/collage";
import type { ImageRef } from "../../assets/images";
import type { FileData, Prop } from "./level-file-data";
export type LevelHydratedData = Omit<FileData, "background" | "props"> & {
    background: ImageRef;
    props: HydratedProp[];
}

export type HydratedProp = Omit<Prop, "collage"> & {
    collage: Collage;
}
