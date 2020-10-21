namespace splitTime.editor.collage {
    export function getCollagePropertiesStuff(collage: file.Collage): client.ObjectProperties {
        const fieldObject = {
            image: {},
            defaultMontageId: {}
        }
        type SimplifiedCollage = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Collage Properties",
            thing: collage as SimplifiedCollage,
            fields: fieldObject
        }
    }

    export function getFramePropertiesStuff(frame: file.collage.Frame): client.ObjectProperties {
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
            fields: fieldObject
        }
    }

    export function getMontagePropertiesStuff(montage: file.collage.Montage): client.ObjectProperties {
        const fieldObject = {
            id: {},
            direction: {}
        }
        type SimplifiedMontage = { [K in keyof typeof fieldObject]: string | number }
        return {
            title: "Montage Properties",
            thing: montage as SimplifiedMontage,
            fields: fieldObject
        }
    }

    export function getMontageFramePropertiesStuff(montageFrame: file.collage.MontageFrame): client.ObjectProperties {
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
            fields: fieldObject
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
            fields: fieldObject
        }
    }
}
