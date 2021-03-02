
declare module "sync-directory" {
    interface Options {
        watch?: boolean
        type?: "copy" | "hardlink"
        deleteOrphaned?: boolean
    }

    function syncDirectory(srcDir: string, targetDir: string, config?: Options): void
    
    export = syncDirectory
}
