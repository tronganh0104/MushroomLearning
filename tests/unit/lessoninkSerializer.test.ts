import { describe, expect, it } from "vitest";
import type { Board } from "../../src/features/board/board.types";
import type { Point, StrokeObject } from "../../src/features/canvas/canvas.types";
import {
  createLessonInkFile,
  deserializeLessonInkFile,
  sanitizeLessonInkFileName,
  serializeLessonInkFile
} from "../../src/features/documents/lessoninkSerializer";

function createStroke(id: string, pageId: string, points: Point[] = [{ x: 0, y: 0 }]): StrokeObject {
  return {
    id,
    pageId,
    kind: "stroke",
    type: "stroke",
    tool: "pen",
    points,
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

function createBoard(overrides: Partial<Board> = {}): Board {
  const pageId = "page-1";

  return {
    id: "board-1",
    title: "Algebra lesson",
    activePageId: pageId,
    pages: [
      {
        id: pageId,
        title: "Page 1",
        index: 0,
        background: {
          type: "blank",
          color: "#ffffff"
        },
        objects: [],
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:00:00.000Z"
      }
    ],
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
    ...overrides
  };
}

describe("createLessonInkFile", () => {
  it("serializes an empty board/project correctly", () => {
    const file = createLessonInkFile(createBoard(), {
      id: "project-1",
      title: "Algebra lesson",
      createdAt: "2026-05-28T00:00:00.000Z"
    });

    expect(file.schemaVersion).toBe(1);
    expect(file.app).toBe("LessonInk");
    expect(file.project).toMatchObject({
      id: "project-1",
      title: "Algebra lesson",
      createdAt: "2026-05-28T00:00:00.000Z"
    });
    expect(file.board.pages).toHaveLength(1);
    expect(file.board.pages[0].objects).toEqual([]);
  });

  it("serializes multiple pages", () => {
    const board = createBoard({
      activePageId: "page-2",
      pages: [
        createBoard().pages[0],
        {
          id: "page-2",
          title: "Page 2",
          index: 1,
          background: {
            type: "blank",
            color: "#ffffff"
          },
          objects: [],
          createdAt: "2026-05-28T00:00:00.000Z",
          updatedAt: "2026-05-28T00:00:00.000Z"
        }
      ]
    });

    const file = createLessonInkFile(board);

    expect(file.board.pages.map((page) => page.id)).toEqual(["page-1", "page-2"]);
    expect(file.board.activePageId).toBe("page-2");
  });

  it("serializes strokes with points, color, width, and pressure", () => {
    const stroke = createStroke("stroke-1", "page-1", [
      { x: 1, y: 2, inputType: "pen", pressure: 0.3 },
      { x: 5, y: 8, inputType: "pen", pressure: 0.7 }
    ]);
    const file = createLessonInkFile(
      createBoard({
        pages: [
          {
            ...createBoard().pages[0],
            objects: [stroke]
          }
        ]
      })
    );

    expect(file.board.pages[0].objects).toEqual([stroke]);
  });
});

describe("deserializeLessonInkFile", () => {
  it("throws a user-friendly error for invalid JSON", () => {
    expect(() => deserializeLessonInkFile("{not-json")).toThrow("The selected file is not valid JSON.");
  });

  it("deserializes a valid .lessonink object and restores activePageId", () => {
    const board = createBoard({ activePageId: "page-1" });
    const loadedProject = deserializeLessonInkFile(serializeLessonInkFile(board));

    expect(loadedProject.board.id).toBe(board.id);
    expect(loadedProject.board.activePageId).toBe("page-1");
    expect(loadedProject.project.title).toBe(board.title);
  });

  it("restores stroke data correctly", () => {
    const stroke = createStroke("stroke-1", "page-1", [
      { x: 1, y: 2, inputType: "pen", pressure: 0.25 },
      { x: 3, y: 4, inputType: "pen", pressure: 0.5 }
    ]);
    const board = createBoard({
      pages: [
        {
          ...createBoard().pages[0],
          objects: [stroke]
        }
      ]
    });

    const loadedProject = deserializeLessonInkFile(serializeLessonInkFile(board));

    expect(loadedProject.board.pages[0].objects).toEqual([stroke]);
  });

  it("handles missing optional metadata fields safely", () => {
    const fileWithoutOptionalMetadata = {
      schemaVersion: 1,
      app: "LessonInk",
      board: {
        pages: [
          {
            objects: []
          }
        ]
      }
    };

    const loadedProject = deserializeLessonInkFile(JSON.stringify(fileWithoutOptionalMetadata));

    expect(loadedProject.board.id).toBe("board-1");
    expect(loadedProject.board.activePageId).toBe("page-1");
    expect(loadedProject.project.title).toBe("Untitled Board");
  });

  it("round-trips a multi-page board with strokes", () => {
    const firstStroke = createStroke("stroke-1", "page-1", [
      { x: 0, y: 0, pressure: 0.1 },
      { x: 10, y: 10, pressure: 0.2 }
    ]);
    const secondStroke = createStroke("stroke-2", "page-2", [
      { x: 20, y: 20, pressure: 0.5 },
      { x: 30, y: 25, pressure: 0.8 }
    ]);
    const board = createBoard({
      activePageId: "page-2",
      pages: [
        {
          ...createBoard().pages[0],
          objects: [firstStroke]
        },
        {
          id: "page-2",
          title: "Page 2",
          index: 1,
          background: {
            type: "blank",
            color: "#ffffff"
          },
          objects: [secondStroke],
          createdAt: "2026-05-28T00:00:00.000Z",
          updatedAt: "2026-05-28T00:00:00.000Z"
        }
      ]
    });

    const loadedProject = deserializeLessonInkFile(serializeLessonInkFile(board));

    expect(loadedProject.board.pages).toHaveLength(2);
    expect(loadedProject.board.activePageId).toBe("page-2");
    expect(loadedProject.board.pages[0].objects).toEqual([firstStroke]);
    expect(loadedProject.board.pages[1].objects).toEqual([secondStroke]);
  });
});

describe("sanitizeLessonInkFileName", () => {
  it("creates a safe .lessonink filename", () => {
    expect(sanitizeLessonInkFileName(" IELTS Writing Task 1 ")).toBe("ielts-writing-task-1.lessonink");
  });
});
