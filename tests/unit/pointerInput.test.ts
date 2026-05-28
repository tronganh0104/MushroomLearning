import { describe, expect, it } from "vitest";
import { appendStablePoints, getPointerPoints } from "../../src/features/canvas/engine/pointerInput";

interface PointerEventStubInput {
  clientX: number;
  clientY: number;
  pointerType?: string;
  pressure?: number;
  coalescedEvents?: PointerEventStubInput[];
  includeCoalescedEvents?: boolean;
}

function createTarget(): HTMLElement {
  return {
    getBoundingClientRect: () =>
      ({
        left: 10,
        top: 20,
        width: 200,
        height: 100
      }) as DOMRect
  } as HTMLElement;
}

function createPointerEvent(input: PointerEventStubInput): PointerEvent {
  const event: Record<string, unknown> = {
    clientX: input.clientX,
    clientY: input.clientY,
    pointerType: input.pointerType ?? "pen"
  };

  if ("pressure" in input) {
    event.pressure = input.pressure;
  }

  if (input.includeCoalescedEvents ?? input.coalescedEvents !== undefined) {
    event.getCoalescedEvents = () => (input.coalescedEvents ?? []).map(createPointerEvent);
  }

  return event as PointerEvent;
}

describe("getPointerPoints", () => {
  const stageSize = { width: 400, height: 200 };

  it("uses coalesced pointer events when they are available", () => {
    const points = getPointerPoints(
      createPointerEvent({
        clientX: 20,
        clientY: 30,
        pressure: 0.2,
        coalescedEvents: [
          { clientX: 60, clientY: 45, pressure: 0.4, pointerType: "pen" },
          { clientX: 110, clientY: 70, pressure: 0.6, pointerType: "pen" }
        ]
      }),
      createTarget(),
      stageSize
    );

    expect(points).toEqual([
      { x: 100, y: 50, inputType: "pen", pressure: 0.4 },
      { x: 200, y: 100, inputType: "pen", pressure: 0.6 }
    ]);
  });

  it("falls back to the original pointer event when coalesced events are empty", () => {
    const points = getPointerPoints(
      createPointerEvent({
        clientX: 50,
        clientY: 45,
        pressure: 0.5,
        coalescedEvents: []
      }),
      createTarget(),
      stageSize
    );

    expect(points).toEqual([{ x: 80, y: 50, inputType: "pen", pressure: 0.5 }]);
  });

  it("falls back to the original pointer event when getCoalescedEvents does not exist", () => {
    const points = getPointerPoints(
      createPointerEvent({
        clientX: 210,
        clientY: 120,
        pointerType: "mouse",
        pressure: 0
      }),
      createTarget(),
      stageSize
    );

    expect(points).toEqual([{ x: 400, y: 200, inputType: "mouse", pressure: 0 }]);
  });

  it("keeps pressure optional when the input event does not provide pressure", () => {
    const [point] = getPointerPoints(
      createPointerEvent({
        clientX: 30,
        clientY: 30,
        pointerType: "touch",
        includeCoalescedEvents: false
      }),
      createTarget(),
      stageSize
    );

    expect(point).toEqual({ x: 40, y: 20, inputType: "touch", pressure: undefined });
  });

  it("maps unknown pointer types safely", () => {
    const [point] = getPointerPoints(
      createPointerEvent({
        clientX: 30,
        clientY: 30,
        pointerType: "trackpad",
        pressure: 0.25
      }),
      createTarget(),
      stageSize
    );

    expect(point.inputType).toBe("unknown");
  });
});

describe("appendStablePoints", () => {
  it("appends points without mutating existing points and skips jitter", () => {
    const existingPoints = [{ x: 0, y: 0 }];
    const nextPoints = [
      { x: 0.1, y: 0.1 },
      { x: 2, y: 0 }
    ];

    const result = appendStablePoints(existingPoints, nextPoints);

    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 }
    ]);
    expect(existingPoints).toEqual([{ x: 0, y: 0 }]);
  });
});
