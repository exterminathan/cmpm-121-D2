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

function createToolPreview(x: number, y: number, thickness: number): Previewable {
    return {
        draw(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points.forEach((line) => line.display(ctx));


            ctx.beginPath();
            ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "black";
            ctx.stroke();

            ctx.fillStyle = "black";
            ctx.fill();
        },
    };
}

// ~-------------------VARIABLES-----------------~

let isDrawing = false;
let lineThickness = 7;

let currentLine: Displayable | null = null;
let points: Displayable[] = [];
let redoStack: Displayable[] = [];

let toolPreview: Previewable | null = null;

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

//Buttons Div
const buttonDiv = document.createElement("div");

//Undo Button
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
buttonDiv.append(undoBtn);

//Redo Button
const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
buttonDiv.append(redoBtn);

//Thin Button
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
buttonDiv.append(thinBtn);

//Thick Button
const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
buttonDiv.append(thickBtn);

//Clear Button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
buttonDiv.append(clearBtn);

app.append(buttonDiv);


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
    isDrawing = true;
    currentLine = drawLine(event.offsetX, event.offsetY, lineThickness);
    points.push(currentLine);
    toolPreview = null;
}

function draw(event: MouseEvent) {
    // also check here for context existing
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

function setThinStroke() {
    lineThickness = 5;
    updateSelectedTool(thinBtn);
    redraw();
}

function setThickStroke() {
    lineThickness = 9;
    updateSelectedTool(thickBtn);
    redraw();

}

function updateSelectedTool(selectedButton: HTMLButtonElement) {
    thinBtn.classList.remove("selectedTool");
    thickBtn.classList.remove("selectedTool");
    selectedButton.classList.add("selectedTool");
}

function handleToolMoved(event: MouseEvent) {
    if (isDrawing || !canvasContext) return;

    toolPreview = createToolPreview(event.offsetX, event.offsetY, lineThickness);

    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent);

    redraw();
}

// ~-------------------LISTENERS------------------~

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("mousemove", handleToolMoved);

canvas.addEventListener("tool-moved", () => {
    console.log("Tool moved event fired");
});

clearBtn.addEventListener("click", () => {
    points = [];
    redoStack = [];
    clearCanvas();
});

//Add to redo stack and remove from canvas
undoBtn.addEventListener("click", () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        redoStack.push(lastLine!);
        redraw();
    }
});

//Remove from redo stack and add to canvas
redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const redoLine = redoStack.pop();
        points.push(redoLine!);
        redraw();
    }
});

thinBtn.addEventListener("click", setThinStroke);
thickBtn.addEventListener("click", setThickStroke);
