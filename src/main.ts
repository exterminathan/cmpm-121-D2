import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
// ~------------------INTERFACES-----------------~
// why no class :(

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}


function drawLine(initX: number, initY: number): Displayable {
    const points: Array<{x: number; y: number}> = [{x: initX, y: initY}];

    return {
        display(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                const point  = points[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();
        },
        drag(x: number, y: number) {
            points.push({x, y});
        }
    }

}



// ~-------------------VARIABLES-----------------~

let isDrawing = false;
let currentLine: Displayable | null = null;
let points: Displayable[] = [];
let redoStack: Displayable[] = [];


// ~------------------STATIC---------------------~

//Title
const titleEL = document.createElement("h1");
titleEL.textContent = APP_NAME;

app.append(titleEL);


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


//Clear Button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
buttonDiv.append(clearBtn);


app.append(buttonDiv);


// ~--------------CANVAS STUFF-------------------~

const canvasContext = canvas.getContext("2d");
// apparently it won't compile if you don't check if the context can be created
// so check here
if (!canvasContext) {
    throw new Error("canvas context don't exist");
}
canvasContext.lineWidth = 2;
canvasContext.lineCap = "round";
canvasContext.strokeStyle = "black";




// ~------------------FUNCTIONS------------------~

function startDraw(event: MouseEvent) {
    isDrawing = true;
    currentLine = drawLine(event.offsetX, event.offsetY);
    points.push(currentLine);
}

function draw(event: MouseEvent) {
    // also check here for context existing
    if (!isDrawing || !canvasContext) {return;}
    currentLine?.drag(event.offsetX, event.offsetY);

    const eventChanged = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(eventChanged);

}

function stopDraw(event: MouseEvent) {
    event;
    isDrawing = false;
    currentLine = null;
}

function clearCanvas() {
    canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
    clearCanvas();
    points.forEach((line) => line.display(canvasContext!));

}


// ~-------------------LISTENERS------------------~

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("drawing-changed", redraw);

clearBtn.addEventListener("click", () => {
    points = [];
    redoStack = [];
    clearCanvas();
})


//Add to redo stack and remove from canvas
undoBtn.addEventListener("click", () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }

        const eventChanged = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(eventChanged);
    }
});

//Remove from redo stack and add to canvas
redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const redoLine = redoStack.pop();
        if (redoLine) {
            points.push(redoLine);
        }

        const eventChanged = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(eventChanged);

    }
})