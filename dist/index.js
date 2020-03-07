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
    class Drawer {
        constructor(canvas, type = "brush", enableTool = ["touch", "mouse", "pen"], backCapacity = 100) {
            this.x = 0;
            this.y = 0;
            this.force = 0;
            this.cancelOnce = false;
            this.brushWidth = 4;
            this.eraserWidth = 10;
            this.color = "#FF5733";
            this.isActive = false;
            this.canvas = canvas;
            this.type = type;
            this.enableTool = enableTool;
            this.context = canvas.getContext("2d");
            this.backupBuffer = new backup_buffer_1.default(backCapacity);
            this.init();
            this.backup();
            console.log("finished init drawer! ");
        }
        resize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.context.putImageData(this.backupBuffer.top(), 0, 0);
        }
        init() {
            const that = this;
            function pressed(e) {
                let isPressed = e.pressure > 0;
                let isFinger = that.enableTool.indexOf("touch") >= 0 && e.pointerType == "touch";
                let isPen = that.enableTool.indexOf("pen") >= 0 && e.pointerType == "pen";
                let isMouse = that.enableTool.indexOf("mouse") >= 0 && e.pointerType == "mouse";
                return isPressed && (isFinger || isPen || isMouse);
            }
            let listener = {
                start(e) {
                    if (!pressed(e)) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    if (that.isActive) {
                        that.backup();
                    }
                    that.isActive = true;
                    that.x = e.offsetX;
                    that.y = e.offsetY;
                    that.force = e.pressure;
                },
                move(e) {
                    if (!pressed(e) || !that.isActive) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    that.draw(that.x, that.y, e.offsetX, e.offsetY, e.pressure);
                    that.x = e.offsetX;
                    that.y = e.offsetY;
                    that.force = e.pressure;
                },
                out(e) {
                    if (!pressed(e)) {
                        return;
                    }
                    that.cancelOnce = true;
                },
                end(e) {
                    if (that.isActive) {
                        that.backup();
                        that.isActive = false;
                    }
                }
            };
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
        draw(sx, sy, ex, ey, force) {
            if (this.cancelOnce) {
                // 取消一次绘制
                this.cancelOnce = false;
                return;
            }
            let that = this;
            /**
             * 绘制圆帽棒形闭合区域
             * @param sx 起始点x
             * @param sy 起始点y
             * @param ex 终点x
             * @param ey 终点y
             * @param sWidth 起点宽度(圆帽直径)
             * @param eWidth 终点宽度(圆帽直径)
             * @param drawInArea 在限制的棒状区域绘制图形
             */
            function drawRodShaped(sx, sy, ex, ey, sWidth, eWidth, drawInArea) {
                that.context.save(); // 保存当前环境的状态。
                that.context.beginPath();
                let xi = Math.atan((sy - ey) / (sx - ex));
                let a = 0.5 * Math.PI + xi;
                let b = 1.5 * Math.PI + xi;
                let c = -0.5 * Math.PI + xi;
                let d = 0.5 * Math.PI + xi;
                if (sx >= ex) {
                    that.context.arc(ex, ey, eWidth / 2, a, b);
                    that.context.arc(sx, sy, sWidth / 2, c, d);
                }
                else {
                    that.context.arc(sx, sy, sWidth / 2, a, b);
                    that.context.arc(ex, ey, eWidth / 2, c, d);
                }
                that.context.closePath();
                that.context.clip(); // 从原始画布剪切任意形状和尺寸的区域，用于限制绘画区域。
                drawInArea(that.context); // 在限制区域进行绘画
                that.context.restore(); //	返回之前保存过的路径状态和属性。
            }
            if (this.type == "brush") {
                drawRodShaped(sx, sy, ex, ey, this.force * this.brushWidth, force * this.brushWidth, (ctx) => {
                    ctx.rect(20, 20, 150, 100);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                });
                return;
            }
            if (this.type == "eraser") {
                drawRodShaped(sx, sy, ex, ey, this.force * this.eraserWidth, force * this.eraserWidth, (ctx) => {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // 清除绘画区域所有的像素
                });
                return;
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
        $("#pen_width").innerHTML = drawer.brushWidth + "";
    });
    $("#btn_eraser").addEventListener("click", function () {
        $("#btn_brush").setAttribute("class", "btn_style");
        $("#btn_eraser").setAttribute("class", "btn_style selected");
        drawer.type = "eraser";
        $("#pen_width").innerHTML = drawer.eraserWidth + "";
    });
    $("#btn_undo").addEventListener("click", function () {
        drawer.undo();
    });
    $("#btn_redo").addEventListener("click", function () {
        drawer.redo();
    });
    $("#btn_a").addEventListener("click", function () {
        if (drawer.type == "brush" && drawer.brushWidth < 100) {
            drawer.brushWidth += 4;
            $("#pen_width").innerHTML = drawer.brushWidth + "";
        }
        if (drawer.type == "eraser" && drawer.eraserWidth < 100) {
            drawer.eraserWidth += 4;
            $("#pen_width").innerHTML = drawer.eraserWidth + "";
        }
    });
    $("#btn_b").addEventListener("click", function () {
        if (drawer.type == "brush" && drawer.brushWidth > 4) {
            drawer.brushWidth -= 4;
            $("#pen_width").innerHTML = drawer.brushWidth + "";
        }
        if (drawer.type == "eraser" && drawer.eraserWidth > 4) {
            drawer.eraserWidth -= 4;
            $("#pen_width").innerHTML = drawer.eraserWidth + "";
        }
    });
    $("#pen_width").innerHTML = drawer.brushWidth + "";
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
    function remove(list, e) {
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
            console.log();
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
                        drawer.enableTool = remove(drawer.enableTool, "mouse");
                        break;
                    case "2":
                        drawer.enableTool = remove(drawer.enableTool, "touch");
                        break;
                    case "3":
                        drawer.enableTool = remove(drawer.enableTool, "pen");
                        break;
                }
            }
        });
    });
    console.log("finish init index! ");
});
