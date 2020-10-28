namespace splitTime.editor.collage {
    export function getCollagePropertiesStuff(collage: file.Collage): client.ObjectProperties {
        const fieldObject = {
            image: {
                isFile: true,
                fileBrowserRoot: splitTime.IMAGE_DIR
            },
            defaultMontageId: {}
        }
        type SimplifiedCollage = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Collage Properties",
            thing: collage as SimplifiedCollage,
            fields: fieldObject,
            doDelete: null
        }
    }

    export function getFramePropertiesStuff(frame: file.collage.Frame, doDelete: () => void): client.ObjectProperties {
        const fieldObject = {
            id: {},
            x: {},
            y: {},
            width: {},
            height: {}
        }
        type SimplifiedFrame = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Frame Properties",
            thing: frame as SimplifiedFrame,
            fields: fieldObject,
            doDelete
        }
    }

    export function getMontagePropertiesStuff(montage: file.collage.Montage, doDelete: () => void): client.ObjectProperties {
        const fieldObject = {
            id: {},
            direction: {}
        }
        type SimplifiedMontage = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Montage Properties",
            thing: montage as SimplifiedMontage,
            fields: fieldObject,
            doDelete
        }
    }

    export function getMontageFramePropertiesStuff(montageFrame: file.collage.MontageFrame, doDelete: () => void): client.ObjectProperties {
        const fieldObject = {
            frameId: {},
            offsetX: {},
            offsetY: {},
            duration: {}
        }
        type SimplifiedMontageFrame = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Montage Frame Properties",
            thing: montageFrame as SimplifiedMontageFrame,
            fields: fieldObject,
            doDelete
        }
    }

    export function getBodySpecPropertiesStuff(body: file.collage.BodySpec): client.ObjectProperties {
        const fieldObject = {
            width: {},
            depth: {},
            height: {}
        }
        type SimplifiedBodySpec = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Body Spec Properties",
            thing: body as SimplifiedBodySpec,
            fields: fieldObject,
            doDelete: () => null
        }
    }
}
