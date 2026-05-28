import type { CanvasPointerType, Point } from "../canvas.types";

const minimumPointDistance = 0.5;

interface PointerSurfaceSize {
  width: number;
  height: number;
}

function toCanvasPointerType(pointerType: string): CanvasPointerType {
  if (pointerType === "mouse" || pointerType === "pen" || pointerType === "touch") {
    return pointerType;
  }

  return "unknown";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toCanvasPoint(event: PointerEvent, target: HTMLElement, size: PointerSurfaceSize): Point {
  const rect = target.getBoundingClientRect();
  const scaleX = rect.width > 0 ? size.width / rect.width : 1;
  const scaleY = rect.height > 0 ? size.height / rect.height : 1;

  return {
    x: clamp((event.clientX - rect.left) * scaleX, 0, size.width),
    y: clamp((event.clientY - rect.top) * scaleY, 0, size.height),
    inputType: toCanvasPointerType(event.pointerType),
    pressure: event.pressure
  };
}

export function getPointerPoints(event: PointerEvent, target: HTMLElement, size: PointerSurfaceSize): Point[] {
  const coalescedEvents =
    typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
  const events = coalescedEvents.length > 0 ? coalescedEvents : [event];

  return events.map((coalescedEvent) => toCanvasPoint(coalescedEvent, target, size));
}

export function getMousePoint(event: MouseEvent, target: HTMLElement, size: PointerSurfaceSize): Point {
  const rect = target.getBoundingClientRect();
  const scaleX = rect.width > 0 ? size.width / rect.width : 1;
  const scaleY = rect.height > 0 ? size.height / rect.height : 1;

  return {
    x: clamp((event.clientX - rect.left) * scaleX, 0, size.width),
    y: clamp((event.clientY - rect.top) * scaleY, 0, size.height),
    inputType: "mouse"
  };
}

export function appendStablePoints(existingPoints: Point[], nextPoints: Point[]): Point[] {
  return nextPoints.reduce<Point[]>((points, point) => {
    const previousPoint = points[points.length - 1];

    if (!previousPoint) {
      return [...points, point];
    }

    const distance = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);

    if (distance < minimumPointDistance) {
      return points;
    }

    return [...points, point];
  }, existingPoints);
}
