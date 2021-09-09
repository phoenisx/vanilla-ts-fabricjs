import "./style.css";
import { uuidv4 } from "./uuid4";
import StarSVG from "./star.svg";
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

/**
 * @returns {[number, number]} [Fill, Stroke]
 */
const getRandomColors = () => {
  const index = Math.floor((Math.random() * 100) % colors.length);
  return colors[index];
};
/**
 * @returns {[number, number]} [Width, Height], [Left, Right]
 */
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
const pageHistoryStack: Record<string, string[]> = {};
const redoUpdateStack: Record<string, string[]> = {};
let activePage = "";
let activeObject: (fabric.Object & { id?: string }) | null = null;

app.querySelector("#createPage")?.addEventListener("click", () => {
  // BE needs to create and return an ID
  const pageId = uuidv4();
  pageHistoryStack[pageId] = [];
  activePage = pageId;
});

const update = () => {
  if (activePage) {
    if (pageHistoryStack[activePage].length >= MAX_HISTORY) {
      pageHistoryStack[activePage].shift(); // Remove the oldest;
    }
    const update = canvas.toJSON(["id"]);
    pageHistoryStack[activePage].push(JSON.stringify(update));
    // console.log("Pages: ", JSON.stringify(update, null, 2));
    console.log("Pages: ", JSON.stringify(update, null, 2));

    // Reset Redo stack, since history stack has updated here and there's
    // nothing to redo to.
    if (
      !redoUpdateStack[activePage] ||
      redoUpdateStack[activePage].length > 0
    ) {
      redoUpdateStack[activePage] = [];
    }
  }
};
const clear = (lastUpdate?: string) => {
  if (activePage) {
    // Clear everything but but the last recent element.
    pageHistoryStack[activePage] = lastUpdate ? [lastUpdate] : [];
  }
};

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

app.querySelector("#createCircle")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!activePage) {
    console.log("No Active Page ID set");
    return;
  }
  const objectId = uuidv4();

  const pos = getRandomPos();
  const circle = createCircle(objectId, pos[0], pos[1]);

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
  clear(pageHistoryStack[activePage].pop());
});
app.querySelector("#recreatePage")?.addEventListener("click", () => {
  // Object Creation is FE specific, we will generate the ID here, and BE will store it in
  // the way they please, but they will always return in getAPI the last canvas JSON representation.
  if (!activePage) {
    console.log("No Active Page ID set");
    return;
  }
  if (pageHistoryStack[activePage].length > 0) {
    canvas.loadFromJSON(
      pageHistoryStack[activePage][pageHistoryStack[activePage].length - 1],
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
      update();
      break;
    case "changeStrokeColor":
      activeObject.set("stroke", selectedColor[1]);
      update();
      break;
  }
});

app.querySelector("#undo")?.addEventListener("click", () => {
  // Shuffle the recent update between history and redo list.
  redoUpdateStack[activePage] = redoUpdateStack[activePage] || [];
  const currentPageHistory = pageHistoryStack[activePage];
  const recentUpdate = currentPageHistory.pop();
  console.log("Update: ", recentUpdate);
  if (recentUpdate) {
    const lastIndex = currentPageHistory.length - 1;
    const last = currentPageHistory[lastIndex];
    console.log("Undo started");
    redoUpdateStack[activePage].push(recentUpdate);
    if (last) {
      canvas.loadFromJSON(last, () => {
        console.log("Undo complete");
      });
    } else {
      canvas.clear();
    }
  }
});

app.querySelector("#redo")?.addEventListener("click", () => {
  // Shuffle the recent update between history and redo list.
  const activeRedoStack = redoUpdateStack[activePage];
  if (activeRedoStack && activeRedoStack.length > 0) {
    const currentPageHistory = pageHistoryStack[activePage];
    const lastUndo = activeRedoStack.pop();
    if (lastUndo) {
      currentPageHistory.push(lastUndo);
      canvas.loadFromJSON(lastUndo, () => {
        console.log("Redo complete");
      });
    }
  }
});

const MARK_KEYS = {
  measure: "rerender",
  mark1: "rerender start",
  mark2: "rerender end",
};

const Renderer = () => {
  const update = (time: number) => {
    if (API.rafId !== null) {
      // This will pause infinitely, if Browser Tab is out-of-focus.
      // We can hadle by replacing the `raf` call with `setTimeout` for the meantime
      // till use re-focuses on the Tab. In this meantime the Framerates will reduce to 1fps.
      // Since there is no activiity, I am guess this hack would work, but we will have to check
      // because Video Streaming might require more frames per second to work, not sure.
      API.rafId = requestAnimationFrame(update);
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
        update(API.timestamp);
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
window.renderer = renderer;

app.querySelector("#drawingMode")?.addEventListener("click", (e) => {
  // http://fabricjs.com/freedrawing
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
  const color = getRandomColors();
  const pos = getRandomPos();
  const objectId = uuidv4();
  fabric.loadSVGFromURL(StarSVG, (results) => {
    console.log("Star SVG Loaded: ", results);
    const star = results[0];
    star.set({
      // @ts-ignore
      id: objectId,
      type: "star",
      top: pos[1],
      left: pos[0],
      fill: color[0],
      stroke: color[1],
      strokeWidth: 0.5,
      scaleX: 10,
      scaleY: 10,
    } as fabric.IPathOptions);
    canvas.add(star);
    objectsPerPage[activePage] = {
      [objectId]: {
        id: objectId,
        object: star,
      },
    };
    update();
  });
});
