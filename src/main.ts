import "./style.css";
import { uuidv4 } from "./uuid4";
// import { fabric } from "./vendor/fabric";

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
const getRandomPos = () => [
  Math.floor((Math.random() * 100) % CANVAS_DIMS.w),
  Math.floor((Math.random() * 100) % CANVAS_DIMS.h),
];

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = new fabric.Canvas(
  app.querySelector("canvas")! as HTMLCanvasElement
);

type FabricObjects = {
  id: string;
  object: fabric.Object;
};
const objectsPerPage: Record<string, Record<string, FabricObjects>> = {};
const pages: Record<string, string[]> = {};
let activePage = "";
let activeObject: fabric.Object & { id?: string } | null = null;

app.querySelector("#createPage")?.addEventListener("click", () => {
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
    const update = canvas.toJSON(["id"]);
    pages[activePage].push(JSON.stringify(update));
    // console.log("Pages: ", JSON.stringify(update, null, 2));
    console.log("Pages: ", JSON.stringify(update, null, 2));
  }
};
const clear = (lastUpdate?: string) => {
  if (activePage) {
    // Clear everything but but the last recent element.
    pages[activePage] = lastUpdate ? [lastUpdate] : [];
  }
};

app.querySelector("#createCircle")?.addEventListener("click", () => {
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
    },
  };
  update();
});

/**
 * This is called only when object is modified directly in the canvas, like rotate or
 * something else. Events where devs are manually setting object properties for an update
 * like Object.set("fill", "something"), needs to also populate with the changes in history.
 */
canvas.on("object:modified", () => {
  update();
});

app.querySelector("#clearPage")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!activePage) {
    console.log("No Active Page ID set");
    return;
  }
  canvas.clear();
  objectsPerPage[activePage] = {};
  clear(pages[activePage].pop());
});
app.querySelector("#recreatePage")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!activePage) {
    console.log("No Active Page ID set");
    return;
  }
  if (pages[activePage].length > 0) {
    canvas.loadFromJSON(
      pages[activePage][pages[activePage].length - 1],
      (...args: any[]) => {
        // OnComplete
        console.log("On Load Complete: ", args);
      }
    );
  }
});

canvas.on("selection:created", function (options) {
  if (options.target) {
    console.log("Selected: ", options.target.fill);
    activeObject = options.target;
  }
});
canvas.on("selection:updated", function (options) {
  if (options.target) {
    console.log("Selection Update: ", options.target.fill);
    activeObject = options.target;
  }
});
canvas.on("selection:cleared", function () {
  console.log("Selection Cleared");
  activeObject = null;
});

app.addEventListener("click", (e: MouseEvent) => {
  const selectedColor = getRandomColors();
  if (!activeObject) {
    console.log("Nothing selected");
    return;
  }

  // const objectsToUpdate = []
  // const selectedObject = canvas.getActiveObject();
  // if (selectedObject.type === 'activeSelection') {
  //   // @ts-ignore
  // 	selectedObject.getObjects().forEach(function(obj) {
  // 		objectsToUpdate.push(obj);
  // 	});
  // } else {
  // 	objectsToUpdate.push(selectedObject);
  // }

  console.log(
    (e.target as HTMLButtonElement).id,
    "changeFillColor",
    "changeFillColor" === (e.currentTarget as HTMLButtonElement).id
  );
  switch ((e.target as HTMLButtonElement).id) {
    case "changeFillColor":
      activeObject.set("fill", selectedColor[0]);
      console.log("New Color: ", selectedColor[0], activeObject.id);
      break;
    case "changeStrokeColor":
      activeObject.set("stroke", selectedColor[1]);
      break;
  }
  update();
});

const Renderer = () => {
  const update = (time: number) => {
    if (API.running) {
      requestAnimationFrame(update);
      if (time - API.timestamp > 1000 / 15) {
        API.timestamp = time;
        canvas.requestRenderAll();
      }
    } else {
      API.timestamp = 0;
    }
  }
  const API = {
    timestamp: 0,
    running: false,
    start() {
      this.running = true;
      requestAnimationFrame((time) => {
        API.timestamp = time;
        update(API.timestamp);
      });
    },
    end() {
      this.running = false;
      API.timestamp = 0;
    },
  };

  return API;
};

const renderer = Renderer();
renderer.start();

// @ts-ignore
window.renderer = renderer;


