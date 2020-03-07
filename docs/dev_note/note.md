## 位置参数
参数|说明
-|-
scrollHeight| 获取对象的滚动高度。 
scrollLeft|设置或获取位于对象左边界和窗口中目前可见内容的最左端之间的距离
scrollTop|设置或获取位于对象最顶端和窗口中可见内容的最顶端之间的距离
scrollWidth|获取对象的滚动宽度
offsetHeight|获取对象相对于版面或由父坐标 offsetParent 属性指定的父坐标的高度
offsetLeft|获取对象相对于版面或由 offsetParent 属性指定的父坐标的计算左侧位置
offsetTop|获取对象相对于版面或由 offsetTop 属性指定的父坐标的计算顶端位置 
event.clientX|相对文档的水平座标
event.clientY|相对文档的垂直座标
event.offsetX|相对容器的水平坐标
event.offsetY|相对容器的垂直坐标 
document.documentElement.scrollTop|垂直方向滚动的值
event.clientX+document.documentElement.scrollTop|相对文档的水平座标+垂直方向滚动的量 


## arc()方法
arc()方法创建弧/曲线（用于创建圆或部分圆）
```
arc(x, y, r, sAngle, eAngle, counterclockwise)
```
参数|描述
-|-
x|圆的中心的 x 坐标。
y|圆的中心的 y 坐标。
r|圆的半径。
sAngle|起始角，以弧度计（弧的圆形的三点钟位置是 0 度）。
eAngle|结束角，以弧度计。
counterclockwise|可选。规定应该逆时针还是顺时针绘图。False = 顺时针，true = 逆时针。
![](https://www.runoob.com/wp-content/uploads/2013/11/img_arc.gif)

## pointer事件
文档来源：https://developer.mozilla.org/zh-CN/docs/Web/API/Pointer_events

PointerEvent 接口扩展了 MouseEvent 接口，并含有以下属性（这些属性的可写属性全部为只读）。

参数|说明
-|-
pointerId|对于某个由指针引起的事件的唯一标识。
width|以CSS像素计数的宽度属性，取决于指针的接触面的几何构成。
height| 以CSS像素计数的高度属性，取决于指针的接触面的几何构成。
pressure|规范化后的指针输入的压力值，取值范围为0到1，0代表硬件可检测到的压力最小值，1代表最大值。
tiltX|the plane angle (in degrees, in the range of -90 to 90) between the Y-Z plane and the plane containing both the transducer (e.g. pen stylus) axis and the Y axis.
tiltY|the plane angle (in degrees, in the range of -90 to 90) between the X-Z plane and the plane containing both the transducer (e.g. pen stylus) axis and the X axis.
pointerType|表明引发该事件的设备类型（"mouse"/"pen"/"touch"/""）。
isPrimary|表示该指针是否为该类型指针中的首选指针。

Event|On Event Handler|Description
-|-|-
pointerover|onpointerover|当定点设备进入某个元素的命中检测 范围时触发。
pointerenter|onpointerenter|当定点设备进入某个元素或其子元素的命中检测范围时，或做为某一类不支悬停（hover）状态的设备所触发的poinerdown事件的后续事件时所触发。(详情可见 pointerdown事件类型).
pointerdown|onpointerdown|当某指针得以激活时触发。
pointermove|onpointermove|当某指针改变其坐标时触发。
pointerup|onpointerup|当某指针不再活跃时触发。
pointercancel|onpointercancel|当浏览器认为某指针不会再生成新的后续事件时触发（例如某设备不再活跃）
pointerout|onpointerout|可能由若干原因触发该事件，包括：定位设备移出了某命中检测的边界；不支持悬浮状态的设备发生pointerup事件（见pointerup事件）； 作为 pointercancel event事件的后续事件（见pointercancel事件）；当数位板检测到数位笔离开了悬浮区域时。
pointerleave|onpointerleave|当定点设备移出某元素的命中检测边界时触发。对于笔形设备来说，当数位板检测到笔移出了悬浮范围时触发。
gotpointercapture|ongotpointercapture|当某元素接受到一个指针捕捉时触发。
lostpointercapture|onlostpointercapture|当针对某个指针的指针捕捉得到释放时触发。

设备按钮状态|button|buttons
-|-|-
鼠标移动且无按钮被按压|-1|0
鼠标左键、触摸接触、压感笔接触（无额外按钮被按压）|0|1
鼠标中键|1|4
鼠标右键、压感笔接触且笔杆按钮被按压|2|2
鼠标X1 (back) |3|8
鼠标X2 (forward)|4|16
压感笔接触且橡皮擦按钮被按压|5|32