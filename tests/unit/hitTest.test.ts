import { describe, expect, it } from "vitest";
import type { Point, StrokeObject } from "../../src/features/canvas/canvas.types";
import { isPointNearStroke } from "../../src/features/canvas/engine/hitTest";

function createStroke(points: Point[], width = 4): StrokeObject {
  return {
    id: "stroke-1",
    pageId: "page-1",
    kind: "stroke",
    type: "stroke",
    tool: "pen",
    points,
    color: "#111827",
    opacity: 1,
    width,
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z"
  };
}

describe("isPointNearStroke", () => {
  it("detects a pointer near a stroke as a hit", () => {
    const stroke = createStroke([
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ]);

    expect(isPointNearStroke({ x: 50, y: 5 }, stroke, 4)).toBe(true);
  });

  it("does not detect a pointer far from a stroke as a hit", () => {
    const stroke = createStroke([
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ]);

    expect(isPointNearStroke({ x: 50, y: 20 }, stroke, 4)).toBe(false);
  });

  it("hit-tests strokes with multiple segments", () => {
    const stroke = createStroke([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);

    expect(isPointNearStroke({ x: 96, y: 60 }, stroke, 4)).toBe(true);
    expect(isPointNearStroke({ x: 80, y: 60 }, stroke, 4)).toBe(false);
  });

  it("uses eraser radius when deciding whether a point hits", () => {
    const stroke = createStroke([
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ]);

    expect(isPointNearStroke({ x: 50, y: 12 }, stroke, 4)).toBe(false);
    expect(isPointNearStroke({ x: 50, y: 12 }, stroke, 10)).toBe(true);
  });

  it("handles single-point strokes", () => {
    const stroke = createStroke([{ x: 10, y: 10 }], 6);

    expect(isPointNearStroke({ x: 14, y: 10 }, stroke, 1)).toBe(true);
    expect(isPointNearStroke({ x: 25, y: 10 }, stroke, 1)).toBe(false);
  });
});
