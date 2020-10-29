namespace splitTime.editor.server {
    /**
     * Wrapper type for API data that should have accompanying project specification
     */
    export type WithProject<T> = {
        projectId: string
        data: T
    }

    // In the future, we could add stuff like WithSession<T> or WithAuth<T> in here.
}