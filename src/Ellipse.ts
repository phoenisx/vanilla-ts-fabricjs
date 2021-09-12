// https://stackoverflow.com/questions/33111045/how-to-free-draw-circle-using-fabric-js
// import { fabric } from "./vendor/fabric";
import { STORE, update } from "./store";
import { uuidv4 } from "./uuid4";

export class Ellipse {
  canvas: fabric.Canvas;
  className = "Circle";
  id: string;
  isDrawing = false;
  startX: number = 0;
  startY: number = 0;
  currentCb?: () => void;
  currentEllipse?: fabric.Ellipse;

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
    this.currentEllipse = undefined;
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
    let activeObj = this.currentEllipse;

    if (activeObj && activeObj instanceof fabric.Ellipse) {
      // const circle = <fabric.Ellipse>activeObj;
      activeObj.stroke = "red";
      activeObj.strokeWidth = 5;
      activeObj.fill = "red";

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

      activeObj.set({
        rx: Math.abs(this.startX - pointer.x) / 2,
      });
      activeObj.set({
        ry: Math.abs(this.startY - pointer.y) / 2,
      });
      activeObj.setCoords();
    }
    this.canvas.renderAll();
  }

  onMouseDown = (obj: fabric.IEvent<Event>) => {
    console.log("on mouse down canvas");
    this.enable();

    let pointer = this.canvas.getPointer(obj.e);
    this.startX = pointer.x;
    this.startY = pointer.y;
    const objectId = uuidv4();

    let ellipse = new fabric.Ellipse({
      // @ts-ignore
      id: objectId,
      top: this.startY,
      left: this.startX,
      rx: 0,
      ry: 0,
      // transparentCorners: false,
      // hasBorders: false,
    });

    this.canvas.add(ellipse);
    this.currentEllipse = ellipse;
    STORE.objectsPerPage[STORE.activePage] = {
      [objectId]: {
        id: objectId,
        object: ellipse,
      },
    };
  }
}
