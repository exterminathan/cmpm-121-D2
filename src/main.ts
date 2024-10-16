import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;


// ~-------------------VARIABLES-----------------~

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let points: Array<Array<{x: number, y: number}>> = [];



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

//Clear Button
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
app.append(clearBtn);


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
    points.push([]);
    addPoint(event.offsetX, event.offsetY);
}

function addPoint(x: number, y: number) {
    points[points.length - 1].push({x,y});

    //send drawing changed event
    const event = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(event);
}



function draw(event: MouseEvent) {
    // also check here for context existing
    if (!isDrawing || !canvasContext) {return;}

    addPoint(event.offsetX, event.offsetY);

}

function stopDraw(event: MouseEvent) {
    isDrawing = false;
}

function clearCanvas() {
    canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
    clearCanvas();

    for (const p of points) {
        canvasContext?.beginPath()
        for (let i = 0; i < p.length; i++) {
            const point  = p[i];
            if (i === 0) {
                canvasContext?.moveTo(point.x, point.y);
            } else {
                canvasContext?.lineTo(point.x, point.y);
            }
        }
        canvasContext?.stroke();
        
    }

}


// ~-------------------LISTENERS------------------~

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("drawing-changed", redraw);

clearBtn.addEventListener("click", () => {
    points = [];
    clearCanvas();
})