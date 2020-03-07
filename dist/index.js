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
        }
        save(e) {
            if (this.pointer + 1 == this.capacity) {
                this.list.shift();
                this.pointer--;
            }
            this.pointer++;
            this.list.splice(this.pointer, this.list.length - this.pointer, e);
        }
        top() {
            if (this.pointer < 0) {
                return null;
            }
            return this.list[this.pointer];
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
    class DrawerPen {
        constructor(start, drawer) {
            this.drawer = drawer;
            this.id = start.pointerId;
            this.type = drawer.type;
            this.width = drawer.width;
            this.color = drawer.color;
            this.x = start.offsetX;
            this.y = start.offsetY;
            this.pressure = start.pressure;
        }
        drawRodShaped(x, y, pressure, drawInArea) {
            this.drawer.context.save(); // 保存当前环境的状态。
            const sx = this.x;
            const sy = this.y;
            const ex = x;
            const ey = y;
            const sWidth = this.pressure * this.width;
            const eWidth = pressure * this.width;
            this.drawer.context.beginPath();
            let xi = Math.atan((sy - ey) / (sx - ex));
            let a = 0.5 * Math.PI + xi;
            let b = 1.5 * Math.PI + xi;
            let c = -0.5 * Math.PI + xi;
            let d = 0.5 * Math.PI + xi;
            if (sx >= ex) {
                this.drawer.context.arc(ex, ey, eWidth / 2, a, b);
                this.drawer.context.arc(sx, sy, sWidth / 2, c, d);
            }
            else {
                this.drawer.context.arc(sx, sy, sWidth / 2, a, b);
                this.drawer.context.arc(ex, ey, eWidth / 2, c, d);
            }
            this.drawer.context.closePath();
            this.drawer.context.clip(); // 从原始画布剪切任意形状和尺寸的区域，用于限制绘画区域。
            drawInArea(); // 在限制区域进行绘画
            this.drawer.context.restore(); //	返回之前保存过的路径状态和属性。
        }
        ;
        skipNextLine() {
            this.isSkipNextLine = true;
        }
        draw(to) {
            const x = to.offsetX;
            const y = to.offsetY;
            const pressure = to.pressure;
            if (!this.isSkipNextLine) {
                switch (this.type) {
                    case "eraser":
                        this.drawRodShaped(x, y, pressure, () => {
                            this.drawer.context.clearRect(0, 0, this.drawer.canvas.width, this.drawer.canvas.height); // 清除绘画区域所有的像素
                        });
                        break;
                    case "brush":
                        this.drawRodShaped(x, y, pressure, () => {
                            this.drawer.context.rect(20, 20, 150, 100);
                            this.drawer.context.fillStyle = this.color;
                            this.drawer.context.fill();
                        });
                        break;
                }
            }
            else {
                this.isSkipNextLine = false;
            }
            this.x = x;
            this.y = y;
            this.pressure = pressure;
        }
    }
    class Drawer {
        constructor(canvas, type = "brush", enableTool = ["touch", "mouse", "pen"], backCapacity = 100) {
            this.pens = [];
            this.width = 4;
            this.color = "#FF5733";
            this.canvas = canvas;
            this.type = type;
            this.enableTool = enableTool;
            this.context = canvas.getContext("2d");
            this.backupBuffer = new backup_buffer_1.default(backCapacity);
            this.init();
            this.backup();
        }
        resize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.context.putImageData(this.backupBuffer.top(), 0, 0);
        }
        getPen(id) {
            return this.pens.find(e => e.id == id);
        }
        removePen(pen) {
            this.pens.splice(this.pens.indexOf(pen), 1);
        }
        init() {
            const that = this;
            function pressed(e) {
                let isPressed = e.pressure > 0;
                let isFinger = that.enableTool.indexOf("touch") >= 0 && e.pointerType == "touch";
                let isPen = that.enableTool.indexOf("pen") >= 0 && e.pointerType == "pen";
                let isPenErase = isPen && e.buttons == 32; // 判断是否是笔上的橡皮擦
                let isMouse = that.enableTool.indexOf("mouse") >= 0 && e.pointerType == "mouse";
                let canDo = isPressed && (isFinger || isPen || isMouse);
                return { isPressed, isFinger, isPen, isPenErase, isMouse, canDo };
            }
            let listener = {
                start(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let p = pressed(e);
                    if (!p.canDo) {
                        return;
                    }
                    if (that.pens.length != 0) {
                        that.backup();
                    }
                    let pen = new DrawerPen(e, that);
                    pen.type = p.isPenErase ? "eraser" : that.type; // 确定笔的类型
                    that.pens.push(pen);
                },
                move(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const pen = that.getPen(e.pointerId);
                    if (!pressed(e).canDo || !pen) {
                        return;
                    }
                    pen.draw(e);
                },
                out(e) {
                    e.preventDefault();
                    if (!pressed(e).canDo) {
                        return;
                    }
                    that.getPen(e.pointerId).skipNextLine();
                },
                end(e) {
                    const pen = that.getPen(e.pointerId);
                    if (pen) {
                        that.backup();
                        that.removePen(pen);
                    }
                },
                preventDefault(e) {
                    e.preventDefault();
                }
            };
            // 防止拖动，关闭掉 touch相关的浏览器事件
            this.canvas.addEventListener("touchstart", listener.preventDefault);
            this.canvas.addEventListener("touchmove", listener.preventDefault);
            this.canvas.addEventListener("touchend", listener.preventDefault);
            this.canvas.addEventListener("touchcancel", listener.preventDefault);
            this.canvas.addEventListener("pointerdown", listener.start);
            this.canvas.addEventListener("pointermove", listener.move);
            this.canvas.addEventListener("pointerout", listener.out);
            this.canvas.addEventListener("pointerup", listener.end);
            // 由于up事件未在cavas上执行，在点击其他地方时，自动备份一下
            document.addEventListener("pointerdown", listener.end);
            document.addEventListener("pointerup", listener.end);
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
    }
    exports.default = Drawer;
});
define("index", ["require", "exports", "drawer"], function (require, exports, drawer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    drawer_1 = __importDefault(drawer_1);
    const $ = (selector, each) => {
        if (each) {
            document.querySelectorAll(selector).forEach(e => {
                each(e);
            });
        }
        else {
            return document.querySelector(selector);
        }
    };
    const drawer = new drawer_1.default($("#canvas"));
    $("#btn_brush").addEventListener("click", function () {
        $("#btn_brush").setAttribute("class", "btn_style selected");
        $("#btn_eraser").setAttribute("class", "btn_style");
        drawer.type = "brush";
        $("#pen_width").innerHTML = drawer.width + "";
    });
    $("#btn_eraser").addEventListener("click", function () {
        $("#btn_brush").setAttribute("class", "btn_style");
        $("#btn_eraser").setAttribute("class", "btn_style selected");
        drawer.type = "eraser";
    });
    $("#btn_undo").addEventListener("click", function () {
        drawer.undo();
    });
    $("#btn_redo").addEventListener("click", function () {
        drawer.redo();
    });
    $("#btn_a").addEventListener("click", function () {
        if (drawer.width < 100) {
            drawer.width += 4;
            $("#pen_width").innerHTML = drawer.width + "";
        }
    });
    $("#btn_b").addEventListener("click", function () {
        if (drawer.width > 4) {
            drawer.width -= 4;
            $("#pen_width").innerHTML = drawer.width + "";
        }
    });
    $("#pen_width").innerHTML = drawer.width + "";
    function initColorBtn() {
        $("#btn_red").setAttribute("class", "btn_style");
        $("#btn_green").setAttribute("class", "btn_style");
        $("#btn_yellow").setAttribute("class", "btn_style");
    }
    $("#btn_red").addEventListener("click", function () {
        initColorBtn();
        $("#btn_red").setAttribute("class", "btn_style color_btn_selected");
        drawer.color = "#FF5733";
    });
    $("#btn_green").addEventListener("click", function () {
        initColorBtn();
        $("#btn_green").setAttribute("class", "btn_style color_btn_selected");
        drawer.color = "#347834";
    });
    $("#btn_yellow").addEventListener("click", function () {
        initColorBtn();
        $("#btn_yellow").setAttribute("class", "btn_style color_btn_selected");
        drawer.color = "#F8F106";
    });
    initColorBtn();
    $("#btn_red").setAttribute("class", "btn_style color_btn_selected");
    function removeAll(list, e) {
        let newList = [];
        for (let index = 0; index < list.length; index++) {
            if (list[index] != e) {
                newList.push(list[index]);
            }
        }
        return newList;
    }
    $("input", e => {
        e.addEventListener("click", function () {
            if (this.checked) {
                switch (this.value) {
                    case "1":
                        if (drawer.enableTool.indexOf("mouse") == -1) {
                            drawer.enableTool.push("mouse");
                        }
                        break;
                    case "2":
                        if (drawer.enableTool.indexOf("touch") == -1) {
                            drawer.enableTool.push("touch");
                        }
                        break;
                    case "3":
                        if (drawer.enableTool.indexOf("pen") == -1) {
                            drawer.enableTool.push("pen");
                        }
                        break;
                }
            }
            else {
                switch (this.value) {
                    case "1":
                        drawer.enableTool = removeAll(drawer.enableTool, "mouse");
                        break;
                    case "2":
                        drawer.enableTool = removeAll(drawer.enableTool, "touch");
                        break;
                    case "3":
                        drawer.enableTool = removeAll(drawer.enableTool, "pen");
                        break;
                }
            }
        });
    });
});
