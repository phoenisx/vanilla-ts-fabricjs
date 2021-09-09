import StarSVG from "./star.svg";
import { STORE, update } from "./store";
import { getRandomColors } from "./utils";
import { uuidv4 } from "./uuid4";

export class Star {
  canvas: fabric.Canvas;
  className = "Circle";
  id: string;
  isDrawing = false;
  startX: number = 0;
  startY: number = 0;
  currentCb?: () => void;
  currentShape?: fabric.Object;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.id = uuidv4();
  }

  init(cb: () => void) {
    this.canvas.on("mouse:down", this.onMouseDown);
    this.canvas.on("mouse:move", this.onMouseMove);
    this.canvas.on("mouse:up", this.onMouseUp);
    this.canvas.on("object:moving", this.disable);
    this.currentCb = cb;
  }

  destroy() {
    this.canvas.off("mouse:down", this.onMouseDown);
    this.canvas.off("mouse:move", this.onMouseMove);
    this.canvas.off("mouse:up", this.onMouseUp);
    this.canvas.off("object:moving", this.disable);
    this.currentShape = undefined;
    this.canvas.selection = true;
    this.currentCb && this.currentCb();
  }

  isEnable() {
    return this.isDrawing;
  }

  enable() {
    this.isDrawing = true;
  }

  disable = () => {
    this.isDrawing = false;
  }

  reset() {
    this.startX = 0;
    this.startY = 0;
  }

  onMouseUp = (_obj: fabric.IEvent<Event>) =>  {
    update(this.canvas);
    this.disable();
    this.reset();
    this.destroy();
  }

  onMouseMove = (obj: fabric.IEvent<Event>) => {
    if (!this.isEnable()) {
      return;
    }

    let pointer = this.canvas.getPointer(obj.e);
    let activeObj = this.currentShape;

    if (activeObj) {
      if (this.startX > pointer.x) {
        activeObj.set({
          left: Math.abs(pointer.x),
        });
      }

      if (this.startY > pointer.y) {
        activeObj.set({
          top: Math.abs(pointer.y),
        });
      }

      console.log("Move: ",  this.startX, pointer.x,  Math.abs(this.startX - pointer.x) / 22);

      activeObj.set({
        scaleX: Math.abs(this.startX - pointer.x) / 22,
      });
      activeObj.set({
        scaleY: Math.abs(this.startY - pointer.y) / 22,
      });
      activeObj.setCoords();
    }
    this.canvas.renderAll();
  }

  onMouseDown = (obj: fabric.IEvent<Event>) => {
    console.log("on mouse down canvas");
    let pointer = this.canvas.getPointer(obj.e);
    this.startX = pointer.x;
    this.startY = pointer.y;
    const objectId = uuidv4();
    this.canvas.selection = false;

    /**
     * Star SVG has a default width/height of
     * 22/22, that means to reach a scale of 1,
     * we need to traverse top and left to 22 pixels
     *
     * Thus we can say, our scale for Star on mouse move
     * will be the diff of top and left divided 22.
     */
    fabric.loadSVGFromURL(StarSVG, (results) => {
      const star = results[0];
      const color = getRandomColors();
      star.set({
        // @ts-ignore
        id: objectId,
        shape: "star", // This is a custom property so that I don't have to mess with fabric prototypes
        top: this.startY,
        left: this.startX,
        fill: color[0],
        stroke: color[1],
        strokeWidth: 0.5,
        scaleX: 0,
        scaleY: 0,
      } as fabric.IPathOptions);
      this.canvas.add(star);
      this.currentShape = star;
      STORE.objectsPerPage[STORE.activePage] = {
        [objectId]: {
          id: objectId,
          object: star,
        },
      };
      this.enable();
    });
  }
}

