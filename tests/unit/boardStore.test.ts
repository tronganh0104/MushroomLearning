import { describe, expect, it } from "vitest";
import type { StrokeObject } from "../../src/features/canvas/canvas.types";
import { addPage, createBlankBoard, setActivePage, setPageObjects } from "../../src/features/board/board.store";

function createStroke(id: string, pageId: string): StrokeObject {
  return {
    id,
    pageId,
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

describe("board store", () => {
  it("adds a new empty page and makes it active", () => {
    const board = createBlankBoard("Live class board");
    const nextBoard = addPage(board);
    const newPage = nextBoard.pages[1];

    expect(nextBoard.pages).toHaveLength(2);
    expect(newPage.title).toBe("Page 2");
    expect(newPage.objects).toEqual([]);
    expect(nextBoard.activePageId).toBe(newPage.id);
  });

  it("preserves page objects when switching active pages", () => {
    const board = addPage(createBlankBoard("Live class board"));
    const firstPage = board.pages[0];
    const secondPage = board.pages[1];
    const firstStroke = createStroke("stroke-1", firstPage.id);
    const secondStroke = createStroke("stroke-2", secondPage.id);

    const boardWithObjects = setPageObjects(
      setPageObjects(board, firstPage.id, [firstStroke]),
      secondPage.id,
      [secondStroke]
    );
    const switchedBoard = setActivePage(boardWithObjects, firstPage.id);

    expect(switchedBoard.activePageId).toBe(firstPage.id);
    expect(switchedBoard.pages[0].objects).toEqual([firstStroke]);
    expect(switchedBoard.pages[1].objects).toEqual([secondStroke]);
  });

  it("clearing one page does not clear another page", () => {
    const board = addPage(createBlankBoard("Live class board"));
    const firstPage = board.pages[0];
    const secondPage = board.pages[1];
    const firstStroke = createStroke("stroke-1", firstPage.id);
    const secondStroke = createStroke("stroke-2", secondPage.id);

    const boardWithObjects = setPageObjects(
      setPageObjects(board, firstPage.id, [firstStroke]),
      secondPage.id,
      [secondStroke]
    );
    const clearedFirstPage = setPageObjects(boardWithObjects, firstPage.id, []);

    expect(clearedFirstPage.pages[0].objects).toEqual([]);
    expect(clearedFirstPage.pages[1].objects).toEqual([secondStroke]);
  });
});
