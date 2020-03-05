```js
// scrollHeight: 获取对象的滚动高度。 
// scrollLeft:设置或获取位于对象左边界和窗口中目前可见内容的最左端之间的距离
// scrollTop:设置或获取位于对象最顶端和窗口中可见内容的最顶端之间的距离
// scrollWidth:获取对象的滚动宽度
// offsetHeight:获取对象相对于版面或由父坐标 offsetParent 属性指定的父坐标的高度
// offsetLeft:获取对象相对于版面或由 offsetParent 属性指定的父坐标的计算左侧位置
// offsetTop:获取对象相对于版面或由 offsetTop 属性指定的父坐标的计算顶端位置 
// event.clientX 相对文档的水平座标
// event.clientY 相对文档的垂直座标
// event.offsetX 相对容器的水平坐标
// event.offsetY 相对容器的垂直坐标 
// document.documentElement.scrollTop 垂直方向滚动的值
// event.clientX+document.documentElement.scrollTop 相对文档的水平座标+垂直方向滚动的量 
```

arc()方法创建弧/曲线（用于创建圆或部分圆）。
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