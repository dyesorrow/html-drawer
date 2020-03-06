var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("backup.buffer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BackupBuffer {
        constructor(capacity = 100) {
            this.list = [];
            this.pointer = -1;
            this.capacity = capacity;
            console.log("finished init backup buffer! ");
        }
        save(e) {
            if (this.pointer + 1 == this.capacity) {
                this.list.shift();
                this.pointer--;
            }
            this.pointer++;
            this.list.splice(this.pointer, this.list.length - this.pointer, e);
        }
        canUndo() {
            return this.pointer > 0;
        }
        canRedo() {
            return this.pointer < this.list.length - 1;
        }
        undo() {
            if (!this.canUndo()) {
                throw "can't undo";
            }
            this.pointer--;
            return this.list[this.pointer];
        }
        redo() {
            if (!this.canRedo()) {
                throw "can't redo";
            }
            this.pointer++;
            return this.list[this.pointer];
        }
    }
    exports.default = BackupBuffer;
});
define("drawer", ["require", "exports", "backup.buffer"], function (require, exports, backup_buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    backup_buffer_1 = __importDefault(backup_buffer_1);
    class Drawer {
        constructor(canvas, type = "brush", backCapacity = 100) {
            this.x = 0;
            this.y = 0;
            this.cancelOnce = false;
            this.canvas = canvas;
            this.type = type;
            this.context = canvas.getContext("2d");
            this.backupBuffer = new backup_buffer_1.default(backCapacity);
            this.init();
            this.backup();
            console.log("finished init drawer! ");
        }
        init() {
            const that = this;
            function info(e) {
                const touches = e.changedTouches;
                let a = touches[0];
                let x = a.clientX - that.canvas.offsetLeft;
                let y = a.clientY - that.canvas.offsetTop;
                let force = a.force;
                return { x, y, force };
            }
            this.canvas.addEventListener("mouseenter", function (e) {
                if (e.buttons == 1) {
                    that.start(e.offsetX, e.offsetY, 0.5);
                }
            });
            this.canvas.addEventListener("mousedown", function (e) {
                if (e.buttons == 1) {
                    that.start(e.offsetX, e.offsetY, 0.5);
                }
            });
            this.canvas.addEventListener("mouseup", function (e) {
                that.end(e.offsetX, e.offsetY, 0.5);
            });
            this.canvas.addEventListener("mouseleave", function (e) {
                if (e.buttons == 1) {
                    that.cancelOnce = true;
                    that.end(e.offsetX, e.offsetY, 0.5);
                }
            });
            this.canvas.addEventListener("mousemove", function (e) {
                if (e.buttons == 1) {
                    e.preventDefault();
                    that.move(e.offsetX, e.offsetY, 0.5);
                }
            });
            this.canvas.addEventListener("touchstart", function (e) {
                let i = info(e);
                that.start(i.x, i.y, i.force);
            }, false);
            this.canvas.addEventListener("touchend", function (e) {
                let i = info(e);
                that.end(i.x, i.y, i.force);
            }, false);
            this.canvas.addEventListener("touchmove", function (e) {
                e.preventDefault();
                let i = info(e);
                that.move(i.x, i.y, i.force);
            }, false);
            this.canvas.addEventListener("touchcancel", function (e) {
                let i = info(e);
                that.end(i.x, i.y, i.force);
            }, false);
        }
        setType(type) {
            this.type = type;
        }
        canUndo() {
            return this.backupBuffer.canUndo();
        }
        canRedo() {
            return this.backupBuffer.canRedo();
        }
        undo() {
            if (this.backupBuffer.canUndo()) {
                this.context.putImageData(this.backupBuffer.undo(), 0, 0);
            }
        }
        redo() {
            if (this.backupBuffer.canRedo()) {
                this.context.putImageData(this.backupBuffer.redo(), 0, 0);
            }
        }
        backup() {
            this.backupBuffer.save(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height));
        }
        start(x, y, force) {
            this.x = x;
            this.y = y;
        }
        move(x, y, force) {
            this.draw(this.x, this.y, x, y, force);
            this.x = x;
            this.y = y;
        }
        end(x, y, force) {
            this.draw(this.x, this.y, x, y, force);
            this.backup();
        }
        draw(sx, sy, ex, ey, force) {
            if (this.cancelOnce) {
                // 取消一次绘制
                this.cancelOnce = false;
                return;
            }
            if (this.type == "brush") {
                return new Promise(() => {
                    this.context.beginPath();
                    this.context.lineWidth = force * 4;
                    this.context.lineCap = "round"; // butt(默认)，没有线帽； round半圆形线帽(直径lineWidth)； square矩形线帽，以矩形绘制线段两端的线帽，两侧扩展的宽度各等于线条宽度的一半。
                    this.context.strokeStyle = 'red';
                    this.context.moveTo(sx, sy);
                    this.context.lineTo(ex, ey);
                    this.context.stroke(); // 填充，或者cv.stroke()画线。
                });
            }
            if (this.type == "eraser") {
                return new Promise(() => {
                    this.context.save(); // 保存当前环境的状态。
                    let redis = force * 10;
                    // 绘制圆帽棒形闭合区域，任意角度
                    this.context.beginPath();
                    let xi = Math.atan((sy - ey) / (sx - ex));
                    let a = 0.5 * Math.PI + xi;
                    let b = 1.5 * Math.PI + xi;
                    let c = -0.5 * Math.PI + xi;
                    let d = 0.5 * Math.PI + xi;
                    if (sx >= ex) {
                        this.context.arc(ex, ey, redis, a, b);
                        this.context.arc(sx, sy, redis, c, d);
                    }
                    else {
                        this.context.arc(sx, sy, redis, a, b);
                        this.context.arc(ex, ey, redis, c, d);
                    }
                    this.context.closePath();
                    this.context.clip(); // 从原始画布剪切任意形状和尺寸的区域，用于限制绘画区域。
                    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // 清除绘画区域所有的像素
                    this.context.restore(); //	返回之前保存过的路径状态和属性。
                });
            }
        }
    }
    exports.default = Drawer;
});
define("index", ["require", "exports", "drawer"], function (require, exports, drawer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    drawer_1 = __importDefault(drawer_1);
    console.log("init index...");
    const $ = (selector) => {
        return document.querySelector(selector);
    };
    const drawer = new drawer_1.default($("#canvas"));
    $("#btn_brush").addEventListener("click", function () {
        $("#btn_brush").setAttribute("class", "btn_style selected");
        $("#btn_eraser").setAttribute("class", "btn_style");
        drawer.setType("brush");
    });
    $("#btn_eraser").addEventListener("click", function () {
        $("#btn_brush").setAttribute("class", "btn_style");
        $("#btn_eraser").setAttribute("class", "btn_style selected");
        drawer.setType("eraser");
    });
    $("#btn_undo").addEventListener("click", function () {
        drawer.undo();
    });
    $("#btn_redo").addEventListener("click", function () {
        drawer.redo();
    });
    console.log("finish init index! ");
});
