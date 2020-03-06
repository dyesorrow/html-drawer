import Drawer from "./drawer";

console.log("init index...");
const $ = (selector: string) => {
    return document.querySelector(selector);
};
const drawer = new Drawer(<HTMLCanvasElement>$("#canvas"));


$("#btn_brush").addEventListener("click", function () {
    $("#btn_brush").setAttribute("class", "btn_style selected");
    $("#btn_eraser").setAttribute("class", "btn_style");
    drawer.type = "brush";
    $("#pen_width").innerHTML = drawer.penWidth + "";
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
    if (drawer.type == "brush" && drawer.penWidth < 100) {
        drawer.penWidth += 4;
        $("#pen_width").innerHTML = drawer.penWidth + "";
    }
    if (drawer.type == "eraser" && drawer.eraserWidth < 100) {
        drawer.eraserWidth += 4;
        $("#pen_width").innerHTML = drawer.eraserWidth + "";

    }

});
$("#btn_b").addEventListener("click", function () {
    if (drawer.type == "brush" && drawer.penWidth > 4) {
        drawer.penWidth -= 4;
        $("#pen_width").innerHTML = drawer.penWidth + "";
    }
    if (drawer.type == "eraser" && drawer.eraserWidth > 4) {
        drawer.eraserWidth -= 4;
        $("#pen_width").innerHTML = drawer.eraserWidth + "";
    }
});
$("#pen_width").innerHTML = drawer.penWidth + "";

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




console.log("finish init index! ");
