import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// ~------------------INTERFACES-----------------~

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

interface Previewable {
    draw(context: CanvasRenderingContext2D): void;
}

// ~------------------COMMANDS------------------~

function drawLine(initX: number, initY: number, thickness: number): Displayable {
    const points: Array<{ x: number; y: number }> = [{ x: initX, y: initY }];

    return {
        display(ctx: CanvasRenderingContext2D) {
            ctx.lineWidth = thickness;
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();
        },
        drag(x: number, y: number) {
            points.push({ x, y });
        },
    };
}

function createLinePreview(x: number, y: number, thickness: number): Previewable {
    return {
        draw(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points.forEach((line) => line.display(ctx));

            ctx.beginPath();
            ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
            ctx.fillStyle = "black";
            ctx.fill();
        },
    };
}

function createStickerPreview(x: number, y: number, sticker: string): Previewable {
    return {
        draw(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points.forEach((line) => line.display(ctx));

            ctx.font = "32px Arial";
            ctx.fillText(sticker, x, y);
        },
    };
}

function createSticker(x: number, y: number, sticker: string): Displayable {
    return {
        display(ctx: CanvasRenderingContext2D) {
            ctx.font = "32px Arial";
            ctx.fillText(sticker, x, y);
        },
        drag(newX: number, newY: number) {
            x = newX;
            y = newY;
        },
    };
}

// ~-------------------VARIABLES-----------------~

const stickers = ["😆", "💀", "🎃"];

let isDrawing = false;
let lineThickness = 7;
let isStickerMode = false;

let currentLine: Displayable | null = null;
let points: Displayable[] = [];
let redoStack: Displayable[] = [];

let toolPreview: Previewable | null = null;
let selectedSticker: string | null = null;

// ~------------------STATIC---------------------~

//Title
const titleELement = document.createElement("h1");
titleELement.textContent = APP_NAME;
app.append(titleELement);

//Main Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);


// First Button Layer
const layer1 = document.createElement("div");

//Undo Button
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
layer1.append(undoBtn);

//Redo Button
const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
layer1.append(redoBtn);

//Clear Button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
layer1.append(clearBtn);

//Export Button
const exportBtn = document.createElement("button");
exportBtn.textContent = "Export";
layer1.append(exportBtn);

app.append(layer1);


// Second Button Layer
const layer2 = document.createElement("div");

//Thin Button
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
layer2.append(thinBtn);

//Thick Button
const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
layer2.append(thickBtn);

//Custom Sticker Button
const customStickerBtn = document.createElement("button");
customStickerBtn.textContent = "🆕";
layer2.append(customStickerBtn);

app.append(layer2);




// Third Button Layer
const layer3 = document.createElement("div");

//Sticker Buttons
stickers.forEach((sticker) => {
    const stickerBtn = document.createElement("button");
    stickerBtn.textContent = sticker;

    //Listener has to be created here as sticker amt can vary
    stickerBtn.addEventListener("click", () => {
        isStickerMode = true;
        selectedSticker = sticker;
        const toolMovedEvent = new Event("tool-moved");
        canvas.dispatchEvent(toolMovedEvent);
    });

    layer3.append(stickerBtn);
});



customStickerBtn.addEventListener("click", () => {
    const newSticker = prompt("Enter your custom sticker:", "🔥");
    //prevent duplicates
    if (newSticker && !stickers.some(emoji => emoji === newSticker)) {
        stickers.push(newSticker);
        const stickerBtn = document.createElement("button");
        stickerBtn.textContent = newSticker;
        stickerBtn.addEventListener("click", () => {
            isStickerMode = true;
            selectedSticker = newSticker;
            const toolMovedEvent = new Event("tool-moved");
            canvas.dispatchEvent(toolMovedEvent);
        });
        layer3.append(stickerBtn);
    }
});

app.append(layer3);

// ~--------------CANVAS STUFF-------------------~

const canvasContext = canvas.getContext("2d");

if (!canvasContext) {
    throw new Error("canvas context doesn't exist");
}
canvasContext.lineWidth = lineThickness;
canvasContext.lineCap = "round";
canvasContext.strokeStyle = "black";

// ~------------------FUNCTIONS------------------~

function startDraw(event: MouseEvent) {
    if (isStickerMode) return;
    isDrawing = true;
    currentLine = drawLine(event.offsetX, event.offsetY, lineThickness);
    points.push(currentLine);
    toolPreview = null;
    redraw();
}

function draw(event: MouseEvent) {
    if (!isDrawing || !canvasContext) return;
    currentLine?.drag(event.offsetX, event.offsetY);
    redraw();
}

function stopDraw() {
    isDrawing = false;
    currentLine = null;
}

function clearCanvas() {
    canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
    clearCanvas();
    points.forEach((line) => line.display(canvasContext!));

    if (toolPreview) {
        toolPreview.draw(canvasContext!);
    }
}

function exportCanvas() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext("2d");

    if (!exportContext) return;

    exportContext.scale(4, 4);
    points.forEach((line) => line.display(exportContext));

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "canvas.png";
    anchor.click();
}

function placeSticker(event: MouseEvent) {
    if (!isStickerMode || !selectedSticker) return;

    const stickerCommand = createSticker(event.offsetX, event.offsetY, selectedSticker);
    points.push(stickerCommand);
    redraw();
}

function updateSelectedTool(selectedButton: HTMLButtonElement) {
    isStickerMode = false;
    selectedSticker = null;
    thinBtn.classList.remove("selectedTool");
    thickBtn.classList.remove("selectedTool");
    selectedButton.classList.add("selectedTool");
}

function setThinStroke() {
    lineThickness = 3;
    updateSelectedTool(thinBtn);
    redraw();
}

function setThickStroke() {
    lineThickness = 15;
    updateSelectedTool(thickBtn);
    redraw();
}

function handleToolMoved(event: MouseEvent) {
    if (isDrawing || !canvasContext) return;

    if (isStickerMode && selectedSticker) {
        toolPreview = createStickerPreview(event.offsetX, event.offsetY, selectedSticker);
    } else {
        toolPreview = createLinePreview(event.offsetX, event.offsetY, lineThickness);
    }

    redraw();
}

// ~-------------------LISTENERS------------------~

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("mousedown", placeSticker);
canvas.addEventListener("mousemove", handleToolMoved);

exportBtn.addEventListener("click", exportCanvas);

clearBtn.addEventListener("click", () => {
    points = [];
    redoStack = [];
    clearCanvas();
});

undoBtn.addEventListener("click", () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        redoStack.push(lastLine!);
        redraw();
    }
});

redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const redoLine = redoStack.pop();
        points.push(redoLine!);
        redraw();
    }
});

thinBtn.addEventListener("click", setThinStroke);
thickBtn.addEventListener("click", setThickStroke);
