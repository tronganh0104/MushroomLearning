import { describe, expect, it } from "vitest";
import type { StrokeObject } from "../../src/features/canvas/canvas.types";
import {
  initialCanvasHistoryState,
  recordCanvasHistory,
  redoCanvasHistory,
  undoCanvasHistory
} from "../../src/features/canvas/history/canvasHistory";

function createStroke(id: string): StrokeObject {
  return {
    id,
    pageId: "page-1",
    kind: "stroke",
    type: "stroke",
    tool: "pen",
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 }
    ],
    color: "#111827",
    opacity: 1,
    width: 4,
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z"
  };
}

describe("canvas history", () => {
  it("undoes and redoes an add stroke action", () => {
    const stroke = createStroke("stroke-1");
    const history = recordCanvasHistory(
      initialCanvasHistoryState,
      { type: "addStroke", pageId: "page-1", strokeId: stroke.id },
      [],
      [stroke]
    );

    const undoResult = undoCanvasHistory(history);
    expect(undoResult).toMatchObject({
      pageId: "page-1",
      objects: []
    });

    const redoResult = redoCanvasHistory(undoResult!.history);
    expect(redoResult).toMatchObject({
      pageId: "page-1",
      objects: [stroke]
    });
  });

  it("undoes and redoes a remove stroke action", () => {
    const stroke = createStroke("stroke-1");
    const history = recordCanvasHistory(
      initialCanvasHistoryState,
      { type: "removeStroke", pageId: "page-1", strokeId: stroke.id },
      [stroke],
      []
    );

    const undoResult = undoCanvasHistory(history);
    expect(undoResult?.objects).toEqual([stroke]);

    const redoResult = redoCanvasHistory(undoResult!.history);
    expect(redoResult?.objects).toEqual([]);
  });

  it("undoes and redoes a remove multiple strokes action", () => {
    const firstStroke = createStroke("stroke-1");
    const secondStroke = createStroke("stroke-2");
    const history = recordCanvasHistory(
      initialCanvasHistoryState,
      {
        type: "removeStrokes",
        pageId: "page-1",
        strokeIds: [firstStroke.id, secondStroke.id]
      },
      [firstStroke, secondStroke],
      []
    );

    const undoResult = undoCanvasHistory(history);
    expect(undoResult?.objects).toEqual([firstStroke, secondStroke]);

    const redoResult = redoCanvasHistory(undoResult!.history);
    expect(redoResult?.objects).toEqual([]);
  });

  it("undoes and redoes a clear canvas action", () => {
    const firstStroke = createStroke("stroke-1");
    const secondStroke = createStroke("stroke-2");
    const history = recordCanvasHistory(
      initialCanvasHistoryState,
      { type: "clearCanvas", pageId: "page-1" },
      [firstStroke, secondStroke],
      []
    );

    const undoResult = undoCanvasHistory(history);
    expect(undoResult).toMatchObject({
      pageId: "page-1",
      objects: [firstStroke, secondStroke]
    });

    const redoResult = redoCanvasHistory(undoResult!.history);
    expect(redoResult).toMatchObject({
      pageId: "page-1",
      objects: []
    });
  });

  it("returns undefined when undo or redo stacks are empty", () => {
    expect(undoCanvasHistory(initialCanvasHistoryState)).toBeUndefined();
    expect(redoCanvasHistory(initialCanvasHistoryState)).toBeUndefined();
  });

  it("clears redo history after recording a new action", () => {
    const firstStroke = createStroke("stroke-1");
    const secondStroke = createStroke("stroke-2");
    const firstHistory = recordCanvasHistory(
      initialCanvasHistoryState,
      { type: "addStroke", pageId: "page-1", strokeId: firstStroke.id },
      [],
      [firstStroke]
    );
    const undoResult = undoCanvasHistory(firstHistory);

    const nextHistory = recordCanvasHistory(
      undoResult!.history,
      { type: "addStroke", pageId: "page-1", strokeId: secondStroke.id },
      [],
      [secondStroke]
    );

    expect(nextHistory.redoStack).toEqual([]);
  });
});
