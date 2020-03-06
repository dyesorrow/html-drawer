import Drawer from "./drawer";

console.log("init index...");
const $ = (selector: string) => {
    return document.querySelector(selector);
};
const drawer = new Drawer(<HTMLCanvasElement>$("#canvas"));


$("#btn_brush").addEventListener("click", function () {
    $("#btn_brush").setAttribute("class", "btn_style selected");
    $("#btn_eraser").setAttribute("class", "btn_style");
    drawer.setType("brush");
});
$("#btn_eraser").addEventListener("click", function () {
    $("#btn_brush").setAttribute("class", "btn_style");
    $("#btn_eraser").setAttribute("class", "btn_style selected");
    drawer.setType("eraser");
});
$("#btn_undo").addEventListener("click", function () {
    drawer.undo();
});
$("#btn_redo").addEventListener("click", function () {
    drawer.redo();
});
console.log("finish init index! ");
