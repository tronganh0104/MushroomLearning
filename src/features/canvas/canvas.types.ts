export type ToolType =
  | "select"
  | "pan"
  | "pen"
  | "eraser"
  | "highlighter"
  | "text"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "image"
  | "pdfPage"
  | "laser";

export type CanvasPointerType = "mouse" | "pen" | "touch" | "unknown";

export interface Point {
  x: number;
  y: number;
  inputType?: CanvasPointerType;
  // Stored now so future pressure-sensitive rendering can use the same stroke model.
  pressure?: number;
}

export interface BaseCanvasObject {
  id: string;
  pageId: string;
  x: number;
  y: number;
  rotation: number;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrokeObject extends BaseCanvasObject {
  kind: "stroke";
  type: "stroke";
  tool: "pen" | "highlighter" | "eraser";
  points: Point[];
  color: string;
  opacity: number;
  width: number;
}

export interface TextObject extends BaseCanvasObject {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  width: number;
  height: number;
}

export interface ShapeObject extends BaseCanvasObject {
  kind: "shape";
  shapeType: "line" | "arrow" | "rectangle" | "ellipse";
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface ImageObject extends BaseCanvasObject {
  kind: "image";
  sourceType: "embedded" | "localReference";
  source: string;
  width: number;
  height: number;
  altText?: string;
}

export interface PdfPageObject extends BaseCanvasObject {
  kind: "pdfPage";
  sourceType: "embeddedRender" | "localReference";
  source: string;
  pdfPageNumber: number;
  width: number;
  height: number;
}

export type CanvasObject = StrokeObject | TextObject | ShapeObject | ImageObject | PdfPageObject;

export interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface CanvasToolState {
  activeTool: ToolType;
  penColor: string;
  penWidth: number;
  eraserRadius: number;
}
