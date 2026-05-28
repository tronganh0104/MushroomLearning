import { describe, expect, it } from "vitest";
import type { Point, StrokeObject } from "../../src/features/canvas/canvas.types";
import {
  appendStrokePoints,
  createPenStroke,
  normalizeStrokePoints,
  toLinePoints
} from "../../src/features/canvas/engine/strokeUtils";

function createStroke(overrides: Partial<StrokeObject> = {}): StrokeObject {
  return {
    id: "stroke-1",
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
    updatedAt: "2026-05-28T00:00:00.000Z",
    ...overrides
  };
}

describe("createPenStroke", () => {
  it("creates the expected structured stroke object", () => {
    const points: Point[] = [
      { x: 4, y: 8, inputType: "pen", pressure: 0.7 },
      { x: 12, y: 18, inputType: "pen", pressure: 0.8 }
    ];

    const stroke = createPenStroke({
      pageId: "page-1",
      points,
      color: "#ff0000",
      width: 6
    });

    expect(stroke).toMatchObject({
      pageId: "page-1",
      kind: "stroke",
      type: "stroke",
      tool: "pen",
      points,
      color: "#ff0000",
      opacity: 1,
      width: 6,
      x: 0,
      y: 0,
      rotation: 0,
      locked: false
    });
    expect(stroke.id).toEqual(expect.any(String));
    expect(stroke.createdAt).toEqual(expect.any(String));
    expect(stroke.updatedAt).toEqual(stroke.createdAt);
  });
});

describe("appendStrokePoints", () => {
  it("appends points to a stroke without corrupting existing stroke data", () => {
    const stroke = createStroke();
    const appendedPoints: Point[] = [
      { x: 20, y: 20, inputType: "mouse" },
      { x: 30, y: 28, inputType: "mouse" }
    ];

    const result = appendStrokePoints(stroke, appendedPoints);

    expect(result).not.toBe(stroke);
    expect(result.points).toEqual([...stroke.points, ...appendedPoints]);
    expect(result).toMatchObject({
      id: stroke.id,
      pageId: stroke.pageId,
      kind: stroke.kind,
      type: stroke.type,
      tool: stroke.tool,
      color: stroke.color,
      opacity: stroke.opacity,
      width: stroke.width,
      x: stroke.x,
      y: stroke.y,
      rotation: stroke.rotation,
      locked: stroke.locked,
      createdAt: stroke.createdAt
    });
    expect(stroke.points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 10 }
    ]);
  });

  it("returns the original stroke when no points are appended", () => {
    const stroke = createStroke();

    expect(appendStrokePoints(stroke, [])).toBe(stroke);
  });
});

describe("stroke point formatting", () => {
  it("stores stroke points in the expected x/y point format", () => {
    const points: Point[] = [
      { x: 1, y: 2 },
      { x: 3, y: 4, pressure: 0.5 }
    ];

    const stroke = createPenStroke({
      pageId: "page-1",
      points,
      color: "#111827",
      width: 4
    });

    expect(stroke.points).toEqual(points);
  });

  it("flattens points for Konva line rendering", () => {
    expect(
      toLinePoints([
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ])
    ).toEqual([1, 2, 3, 4]);
  });

  it("normalizes a single point into a drawable tiny stroke", () => {
    const [originalPoint, syntheticPoint] = normalizeStrokePoints([{ x: 5, y: 6 }]);

    expect(originalPoint).toEqual({ x: 5, y: 6 });
    expect(syntheticPoint).toEqual({ x: 5.1, y: 6.1 });
  });

  it("does not alter multi-point stroke data during normalization", () => {
    const points: Point[] = [
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ];

    expect(normalizeStrokePoints(points)).toBe(points);
    expect(points).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ]);
  });
});
