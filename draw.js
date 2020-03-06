// https://www.jianshu.com/p/a84e8b760ed1

var Backuper = {
    max: 100,
    list: [],
    pointer: -1,
    new: function() {
        let obj = Object.create(Backuper);
        return obj;
    },
    save: function(e) {
        if (this.pointer + 1 == this.max) {
            this.list.shift();
            this.pointer--;
        }
        this.pointer++;
        this.list.splice(this.pointer, this.list.length - this.pointer, e);
    },
    canUndo: function() {
        return this.pointer > 0;
    },
    canRedo: function() {
        console.log(this.pointer + ", " + this.list.length);

        return this.pointer < this.list.length - 1;
    },
    undo: function() {
        if (!this.canUndo()) {
            throw "can't undo";
        }
        this.pointer--;
        return this.list[this.pointer];
    },
    redo: function() {
        if (!this.canRedo()) {
            throw "can't redo";
        }
        this.pointer++;
        return this.list[this.pointer];
    }
}


var Drawer = {
    x: 0,
    y: 0,
    backupBuffer: Backuper.new(),
    canvas: null,
    context: null,
    type: "brush",
    new: function(canvas, type) {
        let obj = Object.create(Drawer);
        obj.type = type;
        obj.canvas = canvas;
        obj.context = canvas.getContext("2d");
        obj.backup();
        return obj;
    },
    backup: function() {
        this.backupBuffer.save(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height));
    },
    canUndo: function() {
        return this.backupBuffer.canUndo();
    },
    canRedo: function() {
        return this.backupBuffer.canRedo();
    },
    undo: function() {
        if (this.backupBuffer.canUndo()) {
            this.context.putImageData(this.backupBuffer.undo(), 0, 0);
        }
    },
    redo: function() {
        if (this.backupBuffer.canRedo()) {
            console.log("redo");
            this.context.putImageData(this.backupBuffer.redo(), 0, 0);
        }
    },
    start: function(x, y, force) {
        this.x = x;
        this.y = y;
    },
    move: function(x, y, force) {
        this.draw(this.x, this.y, x, y, force);
        this.x = x;
        this.y = y;
    },
    end: function(x, y, force) {
        this.draw(this.x, this.y, x, y, force);
        this.backup();
    },
    draw: function(sx, sy, ex, ey, force) {
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
                this.drawAreaLine(sx, sy, ex, ey, redis);
                this.context.clip(); // 从原始画布剪切任意形状和尺寸的区域。

                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.restore(); //	返回之前保存过的路径状态和属性。
            });
        }
    },
    drawAreaLine: function(sx, sy, ex, ey, redis) {
        // 绘制圆帽矩形区域，任意角度
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
    }
}