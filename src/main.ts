import "./style.css";

const APP_NAME = "Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

//Title
const titleEL = document.createElement("h1");
titleEL.textContent = APP_NAME;

app.append(titleEL);



//Main Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

app.append(canvas);