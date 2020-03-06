export default class BackupBuffer<T> {
    private capacity: number;
    private list: T[] = [];
    private pointer: number = -1;

    public constructor(capacity = 100) {
        this.capacity = capacity;
        console.log("finished init backup buffer! ");
    }

    public save(e: T) {
        if (this.pointer + 1 == this.capacity) {
            this.list.shift();
            this.pointer--;
        }
        this.pointer++;
        this.list.splice(this.pointer, this.list.length - this.pointer, e);
    }

    public canUndo() {
        return this.pointer > 0;
    }

    public canRedo() {
        return this.pointer < this.list.length - 1;
    }

    public undo() {
        if (!this.canUndo()) {
            throw "can't undo";
        }
        this.pointer--;
        return this.list[this.pointer];
    }

    public redo() {
        if (!this.canRedo()) {
            throw "can't redo";
        }
        this.pointer++;
        return this.list[this.pointer];
    }
}