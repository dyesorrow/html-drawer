define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BackupBuffer = /** @class */ (function () {
        function BackupBuffer(capacity) {
            if (capacity === void 0) { capacity = 100; }
            this.list = [];
            this.pointer = -1;
            this.capacity = capacity;
        }
        BackupBuffer.prototype.save = function (e) {
            if (this.pointer + 1 == this.capacity) {
                this.list.shift();
                this.pointer--;
            }
            this.pointer++;
            this.list.splice(this.pointer, this.list.length - this.pointer, e);
        };
        BackupBuffer.prototype.canUndo = function () {
            return this.pointer > 0;
        };
        BackupBuffer.prototype.canRedo = function () {
            return this.pointer < this.list.length - 1;
        };
        BackupBuffer.prototype.undo = function () {
            if (!this.canUndo()) {
                throw "can't undo";
            }
            this.pointer--;
            return this.list[this.pointer];
        };
        BackupBuffer.prototype.redo = function () {
            if (!this.canRedo()) {
                throw "can't redo";
            }
            this.pointer++;
            return this.list[this.pointer];
        };
        return BackupBuffer;
    }());
    exports.default = BackupBuffer;
});
