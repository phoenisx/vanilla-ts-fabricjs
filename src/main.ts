import "./style.css";
import { uuidv4 } from "./uuid4";
declare var fabric: typeof import("fabric/fabric-impl");

const CANVAS_DIMS = {
  w: 1024,
  h: 576,
};
const MAX_HISTORY = 100;

const colors = [
  /* [fill, stroke] */
  ["#876FC3", "#694AB5"],
  ["#D55D8D", "#CA3570"],
  ["#DE8854", "#D66A29"],
  ["#C7CC66", "#B9C03F"],
  ["#73BF8B", "#50AF6E"],
  ["#4980B6", "#6D99C5"],
  ["#72C074", "#4EB151"],
] as const;

const getRandomColors = () => {
  const index = Math.floor((Math.random() * 100) % colors.length);
  return colors[index];
};
const getRandomPos = () => [Math.floor((Math.random() * 100) % CANVAS_DIMS.w), Math.floor((Math.random() * 100) % CANVAS_DIMS.h)];

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = new fabric.Canvas(app.querySelector("canvas")! as HTMLCanvasElement);

type FabricObjects = {
  id: string;
  object: fabric.Object;
}
const objectsPerPage: Record<string, Record<string, FabricObjects>> = {};
const pages: Record<string, string[]> = {};
let activePage = "";

app.querySelector("#createPage")?.addEventListener('click', () => {
  // BE needs to create and return an ID
  const pageId = uuidv4();
  pages[pageId] = [];
  activePage = pageId;
});

const update = () => {
  if (activePage) {
    if (pages[activePage].length >= MAX_HISTORY) {
      pages[activePage].shift(); // Remove the oldest;
    }
    pages[activePage].push(canvas.toDatalessJSON(["id"]));
    console.log("Pages: ", JSON.stringify(canvas.toJSON(["id"]), null, 2));
  }
}

app.querySelector("#createCircle")?.addEventListener('click', () => {
// Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!activePage) {
    console.log("No Active Page ID set");
    return;
  }
  const objectId = uuidv4();
  const color = getRandomColors();
  const pos = getRandomPos();
  const circle = new fabric.Circle({
    // @ts-ignore
    id: objectId,
    top: pos[0],
    left: pos[1],
    radius: 20,
    fill: color[0],
    stroke: color[1],
    strokeWidth: 4,
  });
  canvas.add(circle);
  objectsPerPage[activePage] = {
    [objectId]: {
      id: objectId,
      object: circle,
    }
  };
  update();
});


canvas.on("object:modified", () => {
  update();
});
