import BackupBuffer from "./backup.buffer";

type DrawTool = "mouse" | "finger" | "pen";
type DrawType = "brush" | "eraser";

export default class Drawer {
    private x = 0;
    private y = 0;
    private force = 0;
    private cancelOnce = false;
    private backupBuffer: BackupBuffer<ImageData>;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    public type: DrawType;
    public enableTool: DrawTool[];
    public brushWidth = 4;
    public eraserWidth = 10;
    public color = "#FF5733";

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

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.putImageData(this.backupBuffer.top(), 0, 0);
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
            console.log(touches.length);
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
                    that.leave(e.offsetX, e.offsetY, 0.5);
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

    // start or enter
    private start(x: number, y: number, force: number) {
        this.x = x;
        this.y = y;
        this.force = force;
    }
    private move(x: number, y: number, force: number) {
        this.draw(this.x, this.y, x, y, force);
        this.x = x;
        this.y = y;
        this.force = force;
    }

    public leave(x: number, y: number, force: number) {
        this.cancelOnce = true;
        this.end(x, y, force);
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
        function drawRodShaped(sx: number, sy: number, ex: number, ey: number, sWidth: number, eWidth: number, drawInArea: (ctx: CanvasRenderingContext2D) => void) {
  
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
            } else {
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