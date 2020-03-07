import Drawer from "./drawer";

const $ = (selector: string, each?: (e: Element) => void) => {
    if (each) {
        document.querySelectorAll(selector).forEach(e => {
            each(e);
        })
    } else {
        return document.querySelector(selector);
    }
};
const drawer = new Drawer(<HTMLCanvasElement>$("#canvas"));


$("#btn_brush").addEventListener("click", function () {
    $("#btn_brush").setAttribute("class", "btn_style selected");
    $("#btn_eraser").setAttribute("class", "btn_style");
    drawer.type = "brush";
    $("#pen_width").innerHTML = drawer.width + "";
});
$("#btn_eraser").addEventListener("click", function () {
    $("#btn_brush").setAttribute("class", "btn_style");
    $("#btn_eraser").setAttribute("class", "btn_style selected");
    drawer.type = "eraser";
});
$("#btn_undo").addEventListener("click", function () {
    drawer.undo();
});
$("#btn_redo").addEventListener("click", function () {
    drawer.redo();
});

$("#btn_a").addEventListener("click", function () {
    if (drawer.width < 100) {
        drawer.width += 4;
        $("#pen_width").innerHTML = drawer.width + "";
    }
});
$("#btn_b").addEventListener("click", function () {
    if (drawer.width > 4) {
        drawer.width -= 4;
        $("#pen_width").innerHTML = drawer.width + "";
    }
});
$("#pen_width").innerHTML = drawer.width + "";

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


function removeAll<T>(list: T[], e: T) {
    let newList: T[] = [];
    for (let index = 0; index < list.length; index++) {
        if (list[index] != e) {
            newList.push(list[index]);
        }
    }
    return newList;
}
$("input", e => {
    e.addEventListener("click", function (this: HTMLInputElement) {
        if (this.checked) {
            switch (this.value) {
                case "1":
                    if (drawer.enableTool.indexOf("mouse") == -1) {
                        drawer.enableTool.push("mouse")
                    }
                    break;
                case "2":
                    if (drawer.enableTool.indexOf("touch") == -1) {
                        drawer.enableTool.push("touch")
                    }
                    break;
                case "3":
                    if (drawer.enableTool.indexOf("pen") == -1) {
                        drawer.enableTool.push("pen")
                    }
                    break;
            }
        } else {
            switch (this.value) {
                case "1":
                    drawer.enableTool = removeAll(drawer.enableTool, "mouse")
                    break;
                case "2":
                    drawer.enableTool = removeAll(drawer.enableTool, "touch")
                    break;
                case "3":
                    drawer.enableTool = removeAll(drawer.enableTool, "pen")
                    break;
            }
        }
    });
});
