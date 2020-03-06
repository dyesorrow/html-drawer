import BackupBuffer from "./backup.buffer";

type DrawTool = "mouse" | "finger" | "pen";
type DrawType = "brush" | "eraser";

export default class Drawer {
    private x = 0;
    private y = 0;
    private cancelOnce = false;
    private backupBuffer: BackupBuffer<ImageData>;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    
    public  type: DrawType;
    public  enableTool: DrawTool[];
    public  penWidth = 4;
    public  eraserWidth = 10;
    public  color = "#FF5733";

    public constructor(canvas: HTMLCanvasElement, type: DrawType = "brush", enableTool: DrawTool[] = ["finger", "mouse", "pen"], backCapacity = 100) {
        this.canvas = canvas;
        this.type = type;
        this.enableTool = enableTool;
        this.context = canvas.getContext("2d");
        this.backupBuffer = new BackupBuffer<ImageData>(backCapacity);

        this.init();
        this.backup();

        console.log("finished init drawer! ");
    }

    private init() {
        const that = this;

        // 获取touch的基本信息
        function info(e: TouchEvent) {
            const touches = e.changedTouches;
            let a = touches[0];
            let x = a.clientX - that.canvas.offsetLeft;
            let y = a.clientY - that.canvas.offsetTop;
            let force = a.force;
            // 暂时没有较好api支持区分触控笔和手指， 临时方案可以将 radiusX,radiusY < 1 认为是触控笔，其余认为是 手指绘制
            let touchType: "finger" | "pen" = a.radiusX < 1 && a.radiusY < 1 ? "pen" : "finger";

            // 判断是否可以绘制
            let isFinger = that.enableTool.indexOf("finger") >= 0 && touchType == "finger";
            let isPen = that.enableTool.indexOf("pen") >= 0 && touchType == "pen";
            return { x, y, force, toDraw: isFinger || isPen };
        }

        const listener = {
            mouseenter: function (e: MouseEvent) {
                if (that.enableTool.indexOf("mouse") < 0) {
                    return;
                }
                if (e.buttons == 1) {
                    that.start(e.offsetX, e.offsetY, 0.5);
                }
            },
            mousedown: function (e: MouseEvent) {
                if (that.enableTool.indexOf("mouse") < 0) {
                    return;
                }
                if (e.buttons == 1) {
                    that.start(e.offsetX, e.offsetY, 0.5);
                }
            },
            mouseup: function (e: MouseEvent) {
                if (that.enableTool.indexOf("mouse") < 0) {
                    return;
                }
                that.end(e.offsetX, e.offsetY, 0.5);
            },
            mouseleave: function (e: MouseEvent) {
                if (that.enableTool.indexOf("mouse") < 0) {
                    return;
                }
                if (e.buttons == 1) {
                    that.cancelOnce = true;
                    that.end(e.offsetX, e.offsetY, 0.5);
                }
            },
            mousemove: function (e: MouseEvent) {
                if (that.enableTool.indexOf("mouse") < 0) {
                    return;
                }
                if (e.buttons == 1) {
                    e.preventDefault();
                    that.move(e.offsetX, e.offsetY, 0.5);
                }
            },
            touchstart: function (e: TouchEvent) {
                let i = info(e);
                if (i.toDraw) {
                    that.start(i.x, i.y, i.force);
                }
            },
            touchend: function (e: TouchEvent) {
                let i = info(e);
                if (i.toDraw) {
                    that.end(i.x, i.y, i.force);
                }
            },
            touchmove: function (e: TouchEvent) {
                let i = info(e);
                if (i.toDraw) {
                    e.preventDefault();
                    that.move(i.x, i.y, i.force);
                }
            },
            touchcancel: function (e: TouchEvent) {
                let i = info(e);
                if (i.toDraw) {
                    that.end(i.x, i.y, i.force);
                }
            }
        };

        this.canvas.addEventListener("mouseenter", listener.mouseenter);
        this.canvas.addEventListener("mousedown", listener.mousedown);
        this.canvas.addEventListener("mouseup", listener.mouseup);
        this.canvas.addEventListener("mouseleave", listener.mouseleave);
        this.canvas.addEventListener("mousemove", listener.mousemove);
        this.canvas.addEventListener("touchstart", listener.touchstart, false);
        this.canvas.addEventListener("touchend", listener.touchend, false);
        this.canvas.addEventListener("touchmove", listener.touchmove, false);
        this.canvas.addEventListener("touchcancel", listener.touchcancel, false);
    }

    public canUndo() {
        return this.backupBuffer.canUndo();
    }

    public canRedo() {
        return this.backupBuffer.canRedo();
    }

    public undo() {
        if (this.backupBuffer.canUndo()) {
            this.context.putImageData(this.backupBuffer.undo(), 0, 0);
        }
    }

    public redo() {
        if (this.backupBuffer.canRedo()) {
            this.context.putImageData(this.backupBuffer.redo(), 0, 0);
        }
    }

    private backup() {
        this.backupBuffer.save(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    private start(x: number, y: number, force: number) {
        this.x = x;
        this.y = y;
    }
    private move(x: number, y: number, force: number) {
        this.draw(this.x, this.y, x, y, force);
        this.x = x;
        this.y = y;
    }
    private end(x: number, y: number, force: number) {
        this.draw(this.x, this.y, x, y, force);
        this.backup();
    }
    private draw(sx: number, sy: number, ex: number, ey: number, force: number) {
        if (this.cancelOnce) {
            // 取消一次绘制
            this.cancelOnce = false;
            return;
        }

        if (this.type == "brush") {
            return new Promise(() => {
                this.context.beginPath();
                this.context.lineWidth = force * this.penWidth;
                this.context.lineCap = "round"; // butt(默认)，没有线帽； round半圆形线帽(直径lineWidth)； square矩形线帽，以矩形绘制线段两端的线帽，两侧扩展的宽度各等于线条宽度的一半。
                this.context.strokeStyle = this.color;
                this.context.moveTo(sx, sy);
                this.context.lineTo(ex, ey);
                this.context.stroke(); // 填充，或者cv.stroke()画线。
            });
        }
        if (this.type == "eraser") {
            return new Promise(() => {
                this.context.save(); // 保存当前环境的状态。

                let redis = force * this.eraserWidth;
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
                } else {
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