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

function drawLine(initX: number, initY: number, thickness: number, color: string): Displayable {
    const points: Array<{ x: number; y: number }> = [{ x: initX, y: initY }];

    return {
        display(ctx: CanvasRenderingContext2D) {
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
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

function createLinePreview(x: number, y: number, thickness: number, color: string): Previewable {
    return {
        draw(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points.forEach((line) => line.display(ctx));

            ctx.beginPath();
            ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
            ctx.fillStyle = color;
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

// Title
const titleELement = document.createElement("h1");
titleELement.textContent = APP_NAME;
app.append(titleELement);

// Canvas Container
const canvasContainer = document.createElement("div");
canvasContainer.style.display = "flex";
canvasContainer.style.flexDirection = "row";
canvasContainer.style.alignItems = "flex-start";
canvasContainer.style.justifyContent = "center";

// Main Canvas
const canvas = document.createElement("canvas");
canvas.width = 512;
canvas.height = 512;
canvasContainer.append(canvas);

// Emoji Buttons Div (Layer 3)
const layer3 = document.createElement("div");
layer3.classList.add("emoji-container");
canvasContainer.append(layer3);

// Append the canvasContainer to the app
app.append(canvasContainer);

// First Button Layer
const layer1 = document.createElement("div");

// Undo Button
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
layer1.append(undoBtn);

// Redo Button
const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
layer1.append(redoBtn);

// Clear Button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
layer1.append(clearBtn);

// Export Button
const exportBtn = document.createElement("button");
exportBtn.textContent = "Export";
layer1.append(exportBtn);

app.append(layer1);

// Second Button Layer
const layer2 = document.createElement("div");

// Thin Button
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
layer2.append(thinBtn);

// Thick Button
const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
layer2.append(thickBtn);

// Custom Sticker Button
const customStickerBtn = document.createElement("button");
customStickerBtn.textContent = "🆕";
layer2.append(customStickerBtn);

app.append(layer2);

// Color Control Layer
const layer4 = document.createElement("div");

// Color Slider
const colorSlider = document.createElement("input");
colorSlider.type = "range";
colorSlider.min = "0";
colorSlider.max = "360";
colorSlider.value = "0";

layer4.append(colorSlider);

app.append(layer4);

// Sticker Buttons
stickers.forEach((sticker) => {
    const stickerBtn = document.createElement("button");
    stickerBtn.textContent = sticker;

    // Listener for sticker buttons
    stickerBtn.addEventListener("click", () => {
        isStickerMode = true;
        selectedSticker = sticker;
        const toolMovedEvent = new Event("tool-moved");
        canvas.dispatchEvent(toolMovedEvent);
    });

    layer3.append(stickerBtn);
});

// Custom Sticker Button Event Listener
customStickerBtn.addEventListener("click", () => {
    const newSticker = prompt("Enter your custom sticker:", "🔥");
    if (newSticker && !stickers.some((emoji) => emoji === newSticker)) {
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

updateSliderThumbColor(colorSlider);

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
    currentLine = drawLine(event.offsetX, event.offsetY, lineThickness, getColor());
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

function updateSliderThumbColor(slider: HTMLInputElement) {
    const hue = slider.value;
    const color = `hsl(${hue}, 100%, 50%)`;
    slider.style.setProperty("--thumb-color", color);
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
        toolPreview = createLinePreview(event.offsetX, event.offsetY, lineThickness, getColor());
    }

    redraw();
}

function getColor() {
    const hue = colorSlider.value;
    return `hsl(${hue}, 100%, 50%)`;
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

colorSlider.addEventListener("input", () => updateSliderThumbColor(colorSlider));

thinBtn.addEventListener("click", setThinStroke);
thickBtn.addEventListener("click", setThickStroke);
