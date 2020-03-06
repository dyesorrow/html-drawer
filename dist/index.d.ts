declare module "backup.buffer" {
    export default class BackupBuffer<T> {
        private capacity;
        private list;
        private pointer;
        constructor(capacity?: number);
        save(e: T): void;
        canUndo(): boolean;
        canRedo(): boolean;
        undo(): T;
        redo(): T;
    }
}
declare module "drawer" {
    export default class Drawer {
        private x;
        private y;
        private backupBuffer;
        private canvas;
        private context;
        private type;
        constructor(canvas: HTMLCanvasElement, backCapacity?: number);
        private init;
        setType(type: "brush" | "eraser"): void;
        canUndo(): boolean;
        canRedo(): boolean;
        undo(): void;
        redo(): void;
        private backup;
        private start;
        private move;
        private end;
        private draw;
    }
}
declare module "index" { }
