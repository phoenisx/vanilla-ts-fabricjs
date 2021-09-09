type FabricObjects = {
  id: string;
  object: fabric.Object;
};

export const STORE: {
  objectsPerPage: Record<string, Record<string, FabricObjects>>;
  pageHistoryStack: Record<string, string[]>;
  redoUpdateStack: Record<string, string[]>;
  activePage: string;
  activeObject: (fabric.Object & { id?: string }) | null;
} = {
  objectsPerPage: {},
  pageHistoryStack: {},
  redoUpdateStack: {},
  activePage: "",
  activeObject: null,
};

const MAX_HISTORY = 100;

export const update = (canvas: fabric.Canvas) => {
  if (STORE.activePage) {
    if (STORE.pageHistoryStack[STORE.activePage].length >= MAX_HISTORY) {
      STORE.pageHistoryStack[STORE.activePage].shift(); // Remove the oldest;
    }
    const update = canvas.toJSON(["id"]);
    STORE.pageHistoryStack[STORE.activePage].push(JSON.stringify(update));

    // Reset Redo stack, since history stack has updated here and there's
    // nothing to redo to.
    if (
      !STORE.redoUpdateStack[STORE.activePage] ||
      STORE.redoUpdateStack[STORE.activePage].length > 0
    ) {
      STORE.redoUpdateStack[STORE.activePage] = [];
    }
  }
};

export const clear = (lastUpdate?: string) => {
  if (STORE.activePage) {
    // Clear everything but but the last recent element.
    STORE.pageHistoryStack[STORE.activePage] = lastUpdate ? [lastUpdate] : [];
  }
};
