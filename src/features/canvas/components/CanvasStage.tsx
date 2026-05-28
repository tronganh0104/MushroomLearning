import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import type { BoardPage } from "../../board/board.types";
import type { CanvasToolState, Point, StrokeObject } from "../canvas.types";
import { isPointNearStroke } from "../engine/hitTest";
import { appendStablePoints, getMousePoint, getPointerPoints } from "../engine/pointerInput";
import { createPenStroke, normalizeStrokePoints, toLinePoints } from "../engine/strokeUtils";

interface CanvasStageProps {
  page: BoardPage;
  toolState: CanvasToolState;
  onAddStroke: (stroke: StrokeObject) => void;
  onEraseStrokes: (strokeIds: string[]) => void;
}

const fallbackStageSize = {
  width: 960,
  height: 680
};

// TODO(Canvas v0.3+): add pressure-sensitive stroke rendering, touch gestures, zoom/pan,
// palm rejection, drawing tablet testing, stylus-specific UX, local save/load, PDF import,
// PDF/PNG export, presenter mode, and performance optimization for many strokes.
export function CanvasStage({ page, toolState, onAddStroke, onEraseStrokes }: CanvasStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | undefined>(undefined);
  const lastPointerEventAtRef = useRef(0);
  const draftPointsRef = useRef<Point[]>([]);
  const erasedStrokeIdsRef = useRef(new Set<string>());
  const [stageSize, setStageSize] = useState(fallbackStageSize);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [hiddenStrokeIds, setHiddenStrokeIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const updateStageSize = () => {
      setStageSize({
        width: Math.max(container.clientWidth, 320),
        height: Math.max(container.clientHeight, fallbackStageSize.height)
      });
    };
    const resizeObserver = new ResizeObserver(updateStageSize);

    updateStageSize();
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    isDrawingRef.current = false;
    activePointerIdRef.current = undefined;
    lastPointerEventAtRef.current = 0;
    draftPointsRef.current = [];
    erasedStrokeIdsRef.current.clear();
    setDraftPoints([]);
    setHiddenStrokeIds(new Set());
  }, [page.id, toolState.activeTool]);

  const preventBrowserGesture = (event: PointerEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  const preventMouseGesture = (event: MouseEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  const shouldIgnoreMouseFallback = (): boolean => Date.now() - lastPointerEventAtRef.current < 700;

  const getEventPoints = useCallback(
    (event: PointerEvent, target: HTMLElement): Point[] => getPointerPoints(event, target, stageSize),
    [stageSize]
  );

  const getMouseEventPoint = useCallback(
    (event: MouseEvent, target: HTMLElement): Point => getMousePoint(event, target, stageSize),
    [stageSize]
  );

  const capturePointer = (target: HTMLElement, pointerId: number) => {
    if (!target.setPointerCapture) {
      return;
    }

    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Pointer capture can fail if the browser has already cancelled the pointer.
    }
  };

  const releasePointer = (target: HTMLElement | null, pointerId: number | undefined) => {
    if (pointerId === undefined || !target || !target.releasePointerCapture) {
      return;
    }

    try {
      if (target.hasPointerCapture?.(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      // Safe cleanup only; a failed release should never leave drawing state stuck.
    }
  };

  const isActivePointerEvent = (event: PointerEvent): boolean =>
    activePointerIdRef.current === undefined || event.pointerId === activePointerIdRef.current;

  const finishInput = useCallback(() => {
    const activePointerId = activePointerIdRef.current;
    const inputTarget = containerRef.current?.querySelector<HTMLElement>(".canvas-input-layer") ?? null;

    if (!isDrawingRef.current) {
      releasePointer(inputTarget, activePointerId);
      activePointerIdRef.current = undefined;

      return undefined;
    }

    isDrawingRef.current = false;
    releasePointer(inputTarget, activePointerId);
    activePointerIdRef.current = undefined;

    if (toolState.activeTool === "pen" && draftPointsRef.current.length > 0) {
      const points = normalizeStrokePoints(draftPointsRef.current);
      const stroke = createPenStroke({
        pageId: page.id,
        points,
        color: toolState.penColor,
        width: toolState.penWidth
      });

      onAddStroke(stroke);
    }

    if (toolState.activeTool === "eraser" && erasedStrokeIdsRef.current.size > 0) {
      onEraseStrokes([...erasedStrokeIdsRef.current]);
    }

    draftPointsRef.current = [];
    erasedStrokeIdsRef.current.clear();
    setDraftPoints([]);
    setHiddenStrokeIds(new Set());

    return undefined;
  }, [onAddStroke, onEraseStrokes, page.id, toolState.activeTool, toolState.penColor, toolState.penWidth]);

  useEffect(() => {
    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (event.pointerId === activePointerIdRef.current) {
        finishInput();
      }
    };
    const handleWindowMouseEnd = () => {
      if (isDrawingRef.current && activePointerIdRef.current === undefined && !shouldIgnoreMouseFallback()) {
        finishInput();
      }
    };

    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);
    window.addEventListener("mouseup", handleWindowMouseEnd);
    window.addEventListener("blur", finishInput);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
      window.removeEventListener("mouseup", handleWindowMouseEnd);
      window.removeEventListener("blur", finishInput);
    };
  }, [finishInput]);

  const eraseAtPoint = useCallback(
    (point: Point) => {
      const strokes = page.objects.filter((object): object is StrokeObject => object.kind === "stroke");
      const hitStroke = [...strokes]
        .reverse()
        .find(
          (stroke) =>
            !erasedStrokeIdsRef.current.has(stroke.id) &&
            isPointNearStroke(point, stroke, toolState.eraserRadius)
        );

      if (!hitStroke) {
        return;
      }

      erasedStrokeIdsRef.current.add(hitStroke.id);
      setHiddenStrokeIds(new Set(erasedStrokeIdsRef.current));
    },
    [page.objects, toolState.eraserRadius]
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    lastPointerEventAtRef.current = Date.now();
    preventBrowserGesture(event.nativeEvent);

    if (event.button !== 0 || isDrawingRef.current) {
      return;
    }

    const points = getEventPoints(event.nativeEvent, event.currentTarget);
    const point = points[points.length - 1];

    if (!point) {
      return;
    }

    if (toolState.activeTool !== "pen" && toolState.activeTool !== "eraser") {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    capturePointer(event.currentTarget, event.pointerId);

    if (toolState.activeTool === "pen") {
      isDrawingRef.current = true;
      draftPointsRef.current = [point];
      setDraftPoints([point]);
    }

    if (toolState.activeTool === "eraser") {
      isDrawingRef.current = true;
      erasedStrokeIdsRef.current.clear();
      eraseAtPoint(point);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    lastPointerEventAtRef.current = Date.now();
    preventBrowserGesture(event.nativeEvent);

    if (!isDrawingRef.current || !isActivePointerEvent(event.nativeEvent)) {
      return;
    }

    const points = getEventPoints(event.nativeEvent, event.currentTarget);
    const point = points[points.length - 1];

    if (!point) {
      return;
    }

    if (toolState.activeTool === "pen") {
      const nextPoints = appendStablePoints(draftPointsRef.current, points);
      draftPointsRef.current = nextPoints;
      setDraftPoints(nextPoints);
    }

    if (toolState.activeTool === "eraser") {
      points.forEach(eraseAtPoint);
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    lastPointerEventAtRef.current = Date.now();
    preventBrowserGesture(event.nativeEvent);

    if (!isActivePointerEvent(event.nativeEvent)) {
      return;
    }

    finishInput();
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      return;
    }

    handlePointerEnd(event);
  };

  const beginAtPoint = (point: Point) => {
    if (toolState.activeTool === "pen") {
      isDrawingRef.current = true;
      draftPointsRef.current = [point];
      setDraftPoints([point]);
    }

    if (toolState.activeTool === "eraser") {
      isDrawingRef.current = true;
      erasedStrokeIdsRef.current.clear();
      eraseAtPoint(point);
    }
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (shouldIgnoreMouseFallback()) {
      return;
    }

    preventMouseGesture(event.nativeEvent);

    if (event.button !== 0 || isDrawingRef.current) {
      return;
    }

    if (toolState.activeTool !== "pen" && toolState.activeTool !== "eraser") {
      return;
    }

    const point = getMouseEventPoint(event.nativeEvent, event.currentTarget);
    beginAtPoint(point);
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (shouldIgnoreMouseFallback()) {
      return;
    }

    preventMouseGesture(event.nativeEvent);

    if (!isDrawingRef.current || activePointerIdRef.current !== undefined) {
      return;
    }

    const point = getMouseEventPoint(event.nativeEvent, event.currentTarget);

    if (toolState.activeTool === "pen") {
      const nextPoints = appendStablePoints(draftPointsRef.current, [point]);
      draftPointsRef.current = nextPoints;
      setDraftPoints(nextPoints);
    }

    if (toolState.activeTool === "eraser") {
      eraseAtPoint(point);
    }
  };

  const handleMouseEnd = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (shouldIgnoreMouseFallback()) {
      return;
    }

    preventMouseGesture(event.nativeEvent);

    if (activePointerIdRef.current !== undefined) {
      return;
    }

    finishInput();
  };

  return (
    <div className="canvas-stage" aria-label={`Canvas for ${page.title}`}>
      <div className={`canvas-surface tool-${toolState.activeTool}`} ref={containerRef}>
        <Stage
          width={stageSize.width}
          height={stageSize.height}
        >
          <Layer>
            <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill={page.background.color} />

            {page.objects.map((object) => {
              if (object.kind !== "stroke" || hiddenStrokeIds.has(object.id)) {
                return null;
              }

              return (
                <Line
                  key={object.id}
                  points={toLinePoints(object.points)}
                  stroke={object.color}
                  strokeWidth={object.width}
                  opacity={object.opacity}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.35}
                  listening={false}
                />
              );
            })}

            {draftPoints.length > 0 && (
              <Line
                points={toLinePoints(normalizeStrokePoints(draftPoints))}
                stroke={toolState.penColor}
                strokeWidth={toolState.penWidth}
                opacity={1}
                lineCap="round"
                lineJoin="round"
                tension={0.35}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
        <div
          className="canvas-input-layer"
          aria-label={`${toolState.activeTool} input layer`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseEnd}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseEnd}
          onLostPointerCapture={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
        />
      </div>
    </div>
  );
}
