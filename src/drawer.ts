import BackupBuffer from "./backup.buffer";

type DrawTool = "mouse" | "touch" | "pen";
type DrawType = "brush" | "eraser";

class DrawerPen {
    private drawer: Drawer;

    public readonly id: number;
    public type: DrawType;
    public width: number;
    public color: string;

    private x: number;
    private y: number;
    private pressure: number;
    private isSkipNextLine: boolean;
    private disMax = 10;

    public constructor(start: PointerEvent, drawer: Drawer) {
        this.drawer = drawer;

        this.id = start.pointerId;
        this.type = drawer.type;
        this.width = drawer.width;
        this.color = drawer.color;

        this.x = start.offsetX;
        this.y = start.offsetY;
        this.pressure = start.pressure;
    }

    private dis(x1: number, y1: number, x2: number, y2: number, max: number) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) > max * max;
    }

    private drawRodShaped(x: number, y: number, pressure: number, drawInArea: () => void) {
        this.drawer.context.save(); // 保存当前环境的状态。
        const sx = this.x;
        const sy = this.y;
        const ex = x;
        const ey = y;

        let sWidth: number;
        let eWidth: number;
        // 防止触控笔断点问题
        if (this.dis(sx, sy, ex, ey, this.disMax)) {
            // 大于距离限制，则短粗处理
            sWidth = this.pressure * this.width;
            eWidth = pressure * this.width;
        }else{
            // 小于距离限制，则均粗处理
            sWidth = this.pressure * this.width;
            eWidth = sWidth;
        }

        this.drawer.context.beginPath();
        let xi = Math.atan((sy - ey) / (sx - ex));
        let a = 0.5 * Math.PI + xi;
        let b = 1.5 * Math.PI + xi;
        let c = -0.5 * Math.PI + xi;
        let d = 0.5 * Math.PI + xi;
        if (sx >= ex) {
            this.drawer.context.arc(ex, ey, eWidth / 2, a, b);
            this.drawer.context.arc(sx, sy, sWidth / 2, c, d);
        } else {
            this.drawer.context.arc(sx, sy, sWidth / 2, a, b);
            this.drawer.context.arc(ex, ey, eWidth / 2, c, d);
        }
        this.drawer.context.closePath();

        this.drawer.context.clip(); // 从原始画布剪切任意形状和尺寸的区域，用于限制绘画区域。
        drawInArea(); // 在限制区域进行绘画

        this.drawer.context.restore(); //	返回之前保存过的路径状态和属性。
    };

    public skipNextLine() {
        this.isSkipNextLine = true;
    }

    public draw(to: PointerEvent) {
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
                        this.drawer.context.rect(0, 0, this.drawer.canvas.width, this.drawer.canvas.height);
                        this.drawer.context.fillStyle = this.color;
                        this.drawer.context.fill();
                    });
                    break;
            }
        } else {
            this.isSkipNextLine = false;
        }

        this.x = x;
        this.y = y;
        this.pressure = pressure;
    }
}

export default class Drawer {
    private readonly backupBuffer: BackupBuffer<ImageData>;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: CanvasRenderingContext2D;
    private readonly pens: DrawerPen[] = [];

    public type: DrawType;
    public enableTool: DrawTool[];
    public width = 4;
    public color = "#FF5733";

    public constructor(canvas: HTMLCanvasElement, type: DrawType = "brush", enableTool: DrawTool[] = ["touch", "mouse", "pen"], backCapacity = 100) {
        this.canvas = canvas;
        this.type = type;
        this.enableTool = enableTool;
        this.context = canvas.getContext("2d");
        this.backupBuffer = new BackupBuffer<ImageData>(backCapacity);

        this.init();
        this.backup();
    }

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.putImageData(this.backupBuffer.top(), 0, 0);
    }

    public getPen(id: number): DrawerPen {
        return this.pens.find(e => e.id == id);
    }

    public removePen(pen: DrawerPen) {
        this.pens.splice(this.pens.indexOf(pen), 1);
    }

    private init() {
        const that = this;

        function pressed(e: PointerEvent) {
            let isPressed = e.pressure > 0;
            let isFinger = that.enableTool.indexOf("touch") >= 0 && e.pointerType == "touch";
            let isPen = that.enableTool.indexOf("pen") >= 0 && e.pointerType == "pen";
            let isPenErase = isPen && e.buttons == 32; // 判断是否是笔上的橡皮擦
            let isMouse = that.enableTool.indexOf("mouse") >= 0 && e.pointerType == "mouse";
            let canDo = isPressed && (isFinger || isPen || isMouse);
            return { isPressed, isFinger, isPen, isPenErase, isMouse, canDo };
        }

        let listener = {
            start(e: PointerEvent) {
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
                pen.type = p.isPenErase ? "eraser" : that.type;  // 确定笔的类型
                that.pens.push(pen);
            },
            move(e: PointerEvent) {
                e.preventDefault();
                e.stopPropagation();
                const pen = that.getPen(e.pointerId);
                if (!pressed(e).canDo || !pen) {
                    return;
                }
                pen.draw(e);
            },
            out(e: PointerEvent) {
                e.preventDefault();
                if (!pressed(e).canDo) {
                    return;
                }
                that.getPen(e.pointerId).skipNextLine();
            },
            end(e: PointerEvent) {
                const pen = that.getPen(e.pointerId);
                if (pen) {
                    that.backup();
                    that.removePen(pen);
                }
            },
            preventDefault(e: Event) {
                e.preventDefault();
            }
        }

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
}