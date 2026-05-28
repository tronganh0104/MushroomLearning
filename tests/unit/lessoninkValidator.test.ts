import { describe, expect, it } from "vitest";
import { validateLessonInkFile } from "../../src/features/documents/lessoninkValidator";

function createValidFile(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    app: "LessonInk",
    project: {
      id: "project-1",
      title: "Algebra lesson",
      createdAt: "2026-05-28T00:00:00.000Z",
      updatedAt: "2026-05-28T00:00:00.000Z"
    },
    board: {
      id: "board-1",
      title: "Algebra lesson",
      activePageId: "page-1",
      pages: [
        {
          id: "page-1",
          title: "Page 1",
          index: 0,
          background: {
            type: "blank",
            color: "#ffffff"
          },
          objects: [
            {
              id: "stroke-1",
              pageId: "page-1",
              kind: "stroke",
              type: "stroke",
              tool: "pen",
              points: [
                { x: 0, y: 0, inputType: "pen", pressure: 0.2 },
                { x: 10, y: 10, inputType: "pen", pressure: 0.6 }
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
            }
          ],
          createdAt: "2026-05-28T00:00:00.000Z",
          updatedAt: "2026-05-28T00:00:00.000Z"
        }
      ],
      createdAt: "2026-05-28T00:00:00.000Z",
      updatedAt: "2026-05-28T00:00:00.000Z"
    },
    ...overrides
  };
}

describe("validateLessonInkFile", () => {
  it("accepts a valid schemaVersion 1 file", () => {
    const result = validateLessonInkFile(createValidFile());

    expect(result.ok).toBe(true);
    expect(result.ok && result.file.board.pages[0].objects).toHaveLength(1);
  });

  it("rejects an unsupported schemaVersion", () => {
    const result = validateLessonInkFile(createValidFile({ schemaVersion: 2 }));

    expect(result).toEqual({
      ok: false,
      error: "Unsupported LessonInk file version."
    });
  });

  it("rejects the wrong app identifier", () => {
    const result = validateLessonInkFile(createValidFile({ app: "OtherApp" }));

    expect(result).toEqual({
      ok: false,
      error: "The selected file was not created by LessonInk."
    });
  });

  it("rejects a missing board", () => {
    const { board: _board, ...fileWithoutBoard } = createValidFile();

    expect(validateLessonInkFile(fileWithoutBoard).ok).toBe(false);
  });

  it("rejects missing board pages", () => {
    const result = validateLessonInkFile(
      createValidFile({
        board: {
          id: "board-1",
          title: "Algebra lesson"
        }
      })
    );

    expect(result).toEqual({
      ok: false,
      error: "The file is missing board.pages."
    });
  });

  it("rejects malformed stroke data", () => {
    const file = createValidFile({
      board: {
        ...createValidFile().board,
        pages: [
          {
            ...createValidFile().board.pages[0],
            objects: [
              {
                ...createValidFile().board.pages[0].objects[0],
                points: [{ x: "bad", y: 0 }]
              }
            ]
          }
        ]
      }
    });

    const result = validateLessonInkFile(file);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("numeric x and y");
  });

  it("falls back to the first page when activePageId is missing or stale", () => {
    const result = validateLessonInkFile(
      createValidFile({
        board: {
          ...createValidFile().board,
          activePageId: "missing-page"
        }
      })
    );

    expect(result.ok && result.file.board.activePageId).toBe("page-1");
  });
});
