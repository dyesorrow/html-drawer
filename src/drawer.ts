import BackupBuffer from "./backup.buffer";

type DrawTool = "mouse" | "touch" | "pen";
type DrawType = "brush" | "eraser";

export default class Drawer {
    private readonly backupBuffer: BackupBuffer<ImageData>;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;

    private x = 0;
    private y = 0;
    private force = 0;
    private cancelOnce = false;


    public type: DrawType;
    public enableTool: DrawTool[];
    public brushWidth = 4;
    public eraserWidth = 10;
    public color = "#FF5733";
    public isActive = false;

    public constructor(canvas: HTMLCanvasElement, type: DrawType = "brush", enableTool: DrawTool[] = ["touch", "mouse", "pen"], backCapacity = 100) {
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

        function pressed(e: PointerEvent): boolean {
            let isPressed = e.pressure > 0;
            let isFinger = that.enableTool.indexOf("touch") >= 0 && e.pointerType == "touch";
            let isPen = that.enableTool.indexOf("pen") >= 0 && e.pointerType == "pen";
            let isMouse = that.enableTool.indexOf("mouse") >= 0 && e.pointerType == "mouse";
            return isPressed && (isFinger || isPen || isMouse);
        }

        let listener = {
            start(e: PointerEvent) {
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
            move(e: PointerEvent) {
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
            out(e: PointerEvent) {
                if (!pressed(e)) {
                    return;
                }
                that.cancelOnce = true;
            },
            end(e: PointerEvent) {
                if (that.isActive) {
                    that.backup();
                    that.isActive = false;
                }
            }
        }


        this.canvas.addEventListener("pointerdown", listener.start);
        this.canvas.addEventListener("pointermove", listener.move);
        this.canvas.addEventListener("pointerout", listener.out);
        this.canvas.addEventListener("pointerup", listener.end);

        // 由于up事件未在cavas上执行，在点击其他地方时，自动备份一下
        document.addEventListener("pointerdown", listener.end);
        document.addEventListener("pointerup", listener.end);
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