namespace splitTime.editor.server {
    export type WithProject<T> = {
        projectId: string
        data: T
    }
}