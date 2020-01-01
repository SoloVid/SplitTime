namespace SplitTime.level {
    export interface FileData {
        type: "action";
        region: string;
        background: string;
        layers: file_data.Layer[];
        props: any[];
        positions: any[];
    }
    
    namespace file_data {
        
        export interface Layer {
            id: string;
            z: number;
            traces: Trace[];
        }
        
        export interface Trace {
            id: string;
            type: string;
            vertices: string;
            height: string; // for solid
            direction: string; // for stairs
            event: string; // for events
            level: string; // for pointers
            offsetX: string; // for pointers
            offsetY: string; // for pointers
            offsetZ: string; // for pointers
        }
    }
}
