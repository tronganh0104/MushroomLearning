import type { Board, BoardPage, BoardPageBackground } from "../board/board.types";
import type { CanvasObject, CanvasPointerType, Point, StrokeObject } from "../canvas/canvas.types";
import {
  LESSONINK_FILE_APP,
  LESSONINK_FILE_SCHEMA_VERSION,
  type LessonInkFileProjectMetadata,
  type LessonInkFileV1,
  type LessonInkValidationResult
} from "./lessoninkFile.types";

type JsonRecord = Record<string, unknown>;

const fallbackTimestamp = "1970-01-01T00:00:00.000Z";
const pointerTypes: CanvasPointerType[] = ["mouse", "pen", "touch", "unknown"];
const backgroundTypes: BoardPageBackground["type"][] = ["blank", "grid", "dots", "lined", "pdf"];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function optionalString(value: unknown, fallback: string): string {
  return isString(value) && value.length > 0 ? value : fallback;
}

function validatePoint(value: unknown, context: string): { ok: true; point: Point } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `${context} must be an object.` };
  }

  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return { ok: false, error: `${context} must include numeric x and y values.` };
  }

  if (value.inputType !== undefined && (!isString(value.inputType) || !pointerTypes.includes(value.inputType as CanvasPointerType))) {
    return { ok: false, error: `${context} has an unsupported inputType.` };
  }

  if (value.pressure !== undefined && !isFiniteNumber(value.pressure)) {
    return { ok: false, error: `${context} pressure must be numeric when provided.` };
  }

  return {
    ok: true,
    point: {
      x: value.x,
      y: value.y,
      inputType: value.inputType as CanvasPointerType | undefined,
      pressure: value.pressure
    }
  };
}

function validateStroke(value: JsonRecord, context: string): { ok: true; stroke: StrokeObject } | { ok: false; error: string } {
  if (value.kind !== "stroke" || value.type !== "stroke") {
    return { ok: false, error: `${context} must be a stroke object.` };
  }

  if (!isString(value.id) || !isString(value.pageId)) {
    return { ok: false, error: `${context} must include string id and pageId.` };
  }

  if (value.tool !== "pen" && value.tool !== "highlighter" && value.tool !== "eraser") {
    return { ok: false, error: `${context} has an unsupported stroke tool.` };
  }

  if (!Array.isArray(value.points)) {
    return { ok: false, error: `${context} must include a points array.` };
  }

  const points: Point[] = [];

  for (const [pointIndex, pointValue] of value.points.entries()) {
    const result = validatePoint(pointValue, `${context}.points[${pointIndex}]`);

    if (!result.ok) {
      return result;
    }

    points.push(result.point);
  }

  if (!isString(value.color) || !isFiniteNumber(value.width)) {
    return { ok: false, error: `${context} must include color and width.` };
  }

  return {
    ok: true,
    stroke: {
      id: value.id,
      pageId: value.pageId,
      kind: "stroke",
      type: "stroke",
      tool: value.tool,
      points,
      color: value.color,
      opacity: isFiniteNumber(value.opacity) ? value.opacity : 1,
      width: value.width,
      x: isFiniteNumber(value.x) ? value.x : 0,
      y: isFiniteNumber(value.y) ? value.y : 0,
      rotation: isFiniteNumber(value.rotation) ? value.rotation : 0,
      locked: isBoolean(value.locked) ? value.locked : false,
      createdAt: optionalString(value.createdAt, fallbackTimestamp),
      updatedAt: optionalString(value.updatedAt, optionalString(value.createdAt, fallbackTimestamp))
    }
  };
}

function validateCanvasObject(
  value: unknown,
  context: string
): { ok: true; object: CanvasObject } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `${context} must be an object.` };
  }

  if (value.kind !== "stroke") {
    return { ok: false, error: `${context} has an unsupported object kind.` };
  }

  const result = validateStroke(value, context);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    object: result.stroke
  };
}

function validateBackground(value: unknown): BoardPageBackground {
  if (!isRecord(value)) {
    return {
      type: "blank",
      color: "#ffffff"
    };
  }

  return {
    type:
      isString(value.type) && backgroundTypes.includes(value.type as BoardPageBackground["type"])
        ? (value.type as BoardPageBackground["type"])
        : "blank",
    color: isString(value.color) ? value.color : "#ffffff"
  };
}

function validatePage(value: unknown, index: number): { ok: true; page: BoardPage } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `board.pages[${index}] must be an object.` };
  }

  if (!Array.isArray(value.objects)) {
    return { ok: false, error: `board.pages[${index}] must include an objects array.` };
  }

  const pageId = optionalString(value.id, `page-${index + 1}`);
  const objects: CanvasObject[] = [];

  for (const [objectIndex, objectValue] of value.objects.entries()) {
    const result = validateCanvasObject(objectValue, `board.pages[${index}].objects[${objectIndex}]`);

    if (!result.ok) {
      return result;
    }

    if ("pageId" in result.object && result.object.pageId !== pageId) {
      objects.push({
        ...result.object,
        pageId
      });
    } else {
      objects.push(result.object);
    }
  }

  return {
    ok: true,
    page: {
      id: pageId,
      title: optionalString(value.title, `Page ${index + 1}`),
      index: isFiniteNumber(value.index) ? value.index : index,
      background: validateBackground(value.background),
      objects,
      createdAt: optionalString(value.createdAt, fallbackTimestamp),
      updatedAt: optionalString(value.updatedAt, optionalString(value.createdAt, fallbackTimestamp))
    }
  };
}

function validateBoard(value: unknown): { ok: true; board: Board } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "The file is missing a board object." };
  }

  if (!Array.isArray(value.pages)) {
    return { ok: false, error: "The file is missing board.pages." };
  }

  if (value.pages.length === 0) {
    return { ok: false, error: "The board must contain at least one page." };
  }

  const pages: BoardPage[] = [];

  for (const [pageIndex, pageValue] of value.pages.entries()) {
    const result = validatePage(pageValue, pageIndex);

    if (!result.ok) {
      return result;
    }

    pages.push(result.page);
  }

  const firstPageId = pages[0].id;
  const activePageId =
    isString(value.activePageId) && pages.some((page) => page.id === value.activePageId)
      ? value.activePageId
      : firstPageId;

  return {
    ok: true,
    board: {
      id: optionalString(value.id, "board-1"),
      title: optionalString(value.title, "Untitled Board"),
      pages,
      activePageId,
      createdAt: optionalString(value.createdAt, fallbackTimestamp),
      updatedAt: optionalString(value.updatedAt, optionalString(value.createdAt, fallbackTimestamp))
    }
  };
}

function validateProject(value: unknown, board: Board): LessonInkFileProjectMetadata {
  if (!isRecord(value)) {
    return {
      id: board.id,
      title: board.title,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt
    };
  }

  return {
    id: optionalString(value.id, board.id),
    title: optionalString(value.title, board.title),
    createdAt: optionalString(value.createdAt, board.createdAt),
    updatedAt: optionalString(value.updatedAt, board.updatedAt)
  };
}

export function validateLessonInkFile(value: unknown): LessonInkValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: "The selected file is not a LessonInk project." };
  }

  if (value.schemaVersion !== LESSONINK_FILE_SCHEMA_VERSION) {
    return { ok: false, error: "Unsupported LessonInk file version." };
  }

  if (value.app !== LESSONINK_FILE_APP) {
    return { ok: false, error: "The selected file was not created by LessonInk." };
  }

  const boardResult = validateBoard(value.board);

  if (!boardResult.ok) {
    return boardResult;
  }

  return {
    ok: true,
    file: {
      schemaVersion: LESSONINK_FILE_SCHEMA_VERSION,
      app: LESSONINK_FILE_APP,
      project: validateProject(value.project, boardResult.board),
      board: boardResult.board
    }
  };
}
