import "./style.css";
import { uuidv4 } from "./uuid4";
import { Ellipse } from "./Ellipse";
import { clear, STORE, update } from "./store";
import { getRandomColors, getRandomPos } from "./utils";
import { Star } from "./Star";
// import { fabric } from "./vendor/fabric";

// https://codepen.io/MarsAndBack/pen/bGExXzd Custom handles

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = new fabric.Canvas(
  app.querySelector("canvas")! as HTMLCanvasElement
);

app.querySelector("#createPage")?.addEventListener("click", () => {
  // BE needs to create and return an ID
  const pageId = uuidv4();
  STORE.pageHistoryStack[pageId] = [];
  STORE.activePage = pageId;
});

const createCircle = (id: string, x: number, y: number) => {
  const color = getRandomColors();
  return new fabric.Circle({
    // @ts-ignore
    id: id,
    top: y,
    left: x,
    radius: 20,
    fill: color[0],
    stroke: color[1],
    strokeWidth: 4,
  });
};

const ellipseEditor = new Ellipse(canvas);
const starEditor = new Star(canvas);

app.querySelector("#createCircle")?.addEventListener("click", (e) => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!STORE.activePage) {
    console.log("No Active Page ID set");
    return;
  }

  const pos = getRandomPos();
  // const circle = createCircle(objectId, pos[0], pos[1]);
  (<HTMLButtonElement>e.target).textContent = "Drawing Circle";
  ellipseEditor.init(() => {
    // On End
    (<HTMLButtonElement>e.target).textContent = "Create Circle";
  });
});

/**
 * This is called only when object is modified directly in the canvas, like rotate or
 * something else. Events where devs are manually setting object properties for an update
 * like Object.set("fill", "something"), needs to also populate with the changes in history.
 */
canvas.on("object:modified", () => {
  update(canvas);
});

app.querySelector("#clearPage")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!STORE.activePage) {
    console.log("No Active Page ID set");
    return;
  }
  canvas.clear();
  STORE.objectsPerPage[STORE.activePage] = {};
  clear(STORE.pageHistoryStack[STORE.activePage].pop());
});
app.querySelector("#recreatePage")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!STORE.activePage) {
    console.log("No Active Page ID set");
    return;
  }
  if (STORE.pageHistoryStack[STORE.activePage].length > 0) {
    canvas.loadFromJSON(
      STORE.pageHistoryStack[STORE.activePage][
        STORE.pageHistoryStack[STORE.activePage].length - 1
      ],
      (...args: any[]) => {
        // OnComplete
      }
    );
  }
});

canvas.on("selection:created", function (options) {
  if (options.target) {
    STORE.activeObject = options.target;
  }
});
canvas.on("selection:updated", function (options) {
  if (options.target) {
    STORE.activeObject = options.target;
  }
});
canvas.on("selection:cleared", function () {
  STORE.activeObject = null;
});

app.addEventListener("click", (e: MouseEvent) => {
  const selectedColor = getRandomColors();
  if (!STORE.activeObject) {
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

  switch ((e.target as HTMLButtonElement).id) {
    case "changeFillColor":
      STORE.activeObject.set("fill", selectedColor[0]);
      update(canvas);
      break;
    case "changeStrokeColor":
      STORE.activeObject.set("stroke", selectedColor[1]);
      update(canvas);
      break;
  }
});

app.querySelector("#undo")?.addEventListener("click", () => {
  // Shuffle the recent update between history and redo list.
  STORE.redoUpdateStack[STORE.activePage] =
    STORE.redoUpdateStack[STORE.activePage] || [];
  const currentPageHistory = STORE.pageHistoryStack[STORE.activePage];
  const recentUpdate = currentPageHistory.pop();
  if (recentUpdate) {
    const lastIndex = currentPageHistory.length - 1;
    const last = currentPageHistory[lastIndex];
    STORE.redoUpdateStack[STORE.activePage].push(recentUpdate);
    if (last) {
      canvas.loadFromJSON(last, () => {});
    } else {
      canvas.clear();
    }
  }
});

app.querySelector("#redo")?.addEventListener("click", () => {
  // Shuffle the recent update between history and redo list.
  const activeRedoStack = STORE.redoUpdateStack[STORE.activePage];
  if (activeRedoStack && activeRedoStack.length > 0) {
    const currentPageHistory = STORE.pageHistoryStack[STORE.activePage];
    const lastUndo = activeRedoStack.pop();
    if (lastUndo) {
      currentPageHistory.push(lastUndo);
      canvas.loadFromJSON(lastUndo, () => {});
    }
  }
});

const MARK_KEYS = {
  measure: "rerender",
  mark1: "rerender start",
  mark2: "rerender end",
};

const Renderer = () => {
  const renderUpdate = (time: number) => {
    if (API.rafId !== null) {
      // This will pause infinitely, if Browser Tab is out-of-focus.
      // We can hadle by replacing the `raf` call with `setTimeout` for the meantime
      // till use re-focuses on the Tab. In this meantime the Framerates will reduce to 1fps.
      // Since there is no activiity, I am guess this hack would work, but we will have to check
      // because Video Streaming might require more frames per second to work, not sure.
      API.rafId = requestAnimationFrame(renderUpdate);
      if (time - API.timestamp > 1000 / 15) {
        performance.mark(MARK_KEYS.mark1);
        API.timestamp = time;
        canvas.requestRenderAll();
        performance.mark(MARK_KEYS.mark2);
        performance.measure(
          MARK_KEYS.measure,
          MARK_KEYS.mark1,
          MARK_KEYS.mark2
        );
      }
    } else {
      API.timestamp = 0;
    }
  };
  const API: {
    timestamp: number;
    rafId: number | null;
    start: () => void;
    end: () => void;
  } = {
    timestamp: 0,
    rafId: null,
    start() {
      API.rafId = requestAnimationFrame((time) => {
        API.timestamp = time;
        renderUpdate(API.timestamp);
      });
    },
    end() {
      API.rafId && cancelAnimationFrame(API.rafId);
      API.rafId = null;
      API.timestamp = 0;
    },
  };

  return API;
};

const renderer = Renderer();
renderer.start();

// @ts-ignore
window.canvas = canvas;
// @ts-ignore
window.renderer = renderer;

app.querySelector("#drawingMode")?.addEventListener("click", (e) => {
  // http://fabricjs.com/freedrawing
  // http://fabricjs.com/erasing
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.width = 8;
  canvas.isDrawingMode = !canvas.isDrawingMode;
  (<HTMLButtonElement>e.target).textContent = canvas.isDrawingMode
    ? "Exit Drawing Mode"
    : "Drawing Mode";
});

/**
 * Control Customisation:
 * http://fabricjs.com/controls-customization
 * http://fabricjs.com/customization
 */

app.querySelector("#addText")?.addEventListener("click", (e) => {
  const text = "this is\na multiline\ntext\naligned right!";
  const alignedRightText = new fabric.IText(text, {
    textAlign: "right",
  });
  canvas.add(alignedRightText);
});

app.querySelector("#alignCenter")?.addEventListener("click", (e) => {
  const object = canvas.getActiveObject();
  console.log("Selected Object Type: ", object.type);
  if (object.type === "i-text") {
    (<fabric.Text>object).set("textAlign", "center");
  }
});

app.querySelector("#addStar")?.addEventListener("click", (e) => {
  // https://github.com/fabricjs/fabric.js/issues/2019

  // const polygon = new fabric.Polygon(
  //   [
  //     { x: 200, y: 10 },
  //     { x: 250, y: 50 },
  //     { x: 250, y: 180 },
  //     { x: 150, y: 180 },
  //     { x: 150, y: 50 },
  //   ],
  //   {
  //     fill: "green",
  //   }
  // );
  // const circle = createCircle(objectId, pos[0], pos[1]);
  (<HTMLButtonElement>e.target).textContent = "Drawing Star";
  starEditor.init(() => {
    // On End
    (<HTMLButtonElement>e.target).textContent = "Create Star";
  });
});

const handleErasingComplete = (e: {path: fabric.Path} & MouseEvent | fabric.IEvent) => {
  update(canvas);
}

app.querySelector("#eraser")?.addEventListener("click", (e) => {
  canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
  canvas.freeDrawingBrush.width = 10;
  canvas.isDrawingMode = !canvas.isDrawingMode;
  if (canvas.isDrawingMode) {
    (<HTMLButtonElement>e.target).textContent =  "Erasing";
    canvas.on("erasing:end", handleErasingComplete);
  } else {
    (<HTMLButtonElement>e.target).textContent =  "Erase";
    canvas.off("erasing:end", handleErasingComplete);
  }


});

