import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;


// ~-------------------VARIABLES-----------------~
let isDrawing = false;
let lastX = 0;
let lastY = 0;




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
    [lastX, lastY] = [event.offsetX, event.offsetY];
}

function draw(event: MouseEvent) {
    // also check here for context existing
    if (!isDrawing || !canvasContext) {return;}

    canvasContext.beginPath();
    canvasContext.moveTo(lastX, lastY);
    canvasContext.lineTo(event.offsetX, event.offsetY);
    canvasContext.stroke();

    [lastX, lastY] = [event.offsetX, event.offsetY];
}

function stopDraw(event: MouseEvent) {
    isDrawing = false;
}


// ~-------------------LISTENERS------------------~
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

clearBtn.addEventListener("click", () => {
    canvasContext?.clearRect(0,0,canvas.width, canvas.height);
})