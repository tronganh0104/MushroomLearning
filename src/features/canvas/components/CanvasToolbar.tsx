import { 
  Hand, MousePointer2, Pencil, Highlighter, Type, Eraser, 
  Undo2, Redo2, Trash2, Save, FolderOpen, 
  Image as ImageIcon, FileText, Play, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import type { CanvasToolState, ToolType } from "../canvas.types";

interface CanvasToolbarProps {
  projectTitle: string;
  saveStatus: "Saved" | "Saving" | "Unsaved changes";
  toolState: CanvasToolState;
  canUndo: boolean;
  canRedo: boolean;
  hasObjects: boolean;
  onToolChange: (tool: ToolType) => void;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onImportImage: () => void;
  onImportPdf: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  isPresenterMode: boolean;
  pagePositionLabel: string;
  canGoPreviousPage: boolean;
  canGoNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onTogglePresenterMode: () => void;
}

const teachingTools: Array<{
  id: ToolType;
  icon: any;
  label: string;
  title: string;
}> = [
  {
    id: "pan",
    icon: Hand,
    label: "Hand",
    title: "Pan the canvas"
  },
  {
    id: "select",
    icon: MousePointer2,
    label: "Select",
    title: "Select and move text"
  },
  {
    id: "pen",
    icon: Pencil,
    label: "Pen",
    title: "Draw freehand strokes"
  },
  {
    id: "highlighter",
    icon: Highlighter,
    label: "Mark",
    title: "Highlight over lesson content"
  },
  {
    id: "text",
    icon: Type,
    label: "Text",
    title: "Click the canvas to add typed text"
  },
  {
    id: "eraser",
    icon: Eraser,
    label: "Eraser",
    title: "Erase whole strokes near the cursor"
  }
];

export function CanvasToolbar({
  projectTitle,
  saveStatus,
  toolState,
  canUndo,
  canRedo,
  hasObjects,
  onToolChange,
  onPenColorChange,
  onPenWidthChange,
  onUndo,
  onRedo,
  onClear,
  onSaveProject,
  onOpenProject,
  onImportImage,
  onImportPdf,
  onExportPng,
  onExportPdf,
  isPresenterMode,
  pagePositionLabel,
  canGoPreviousPage,
  canGoNextPage,
  onPreviousPage,
  onNextPage,
  onTogglePresenterMode
}: CanvasToolbarProps) {
  const activeSizeValue =
    toolState.activeTool === "highlighter"
      ? toolState.highlighterWidth
      : toolState.activeTool === "text"
        ? toolState.textSize
        : toolState.penWidth;
  const activeColorValue =
    toolState.activeTool === "highlighter"
      ? toolState.highlighterColor
      : toolState.activeTool === "text"
        ? toolState.textColor
        : toolState.penColor;
  const activeSizeLabel = toolState.activeTool === "text" ? "Size" : "Stroke";
  const showsToolSettings =
    toolState.activeTool === "pen" || toolState.activeTool === "highlighter" || toolState.activeTool === "text";
  const activeColorLabel =
    toolState.activeTool === "highlighter"
      ? "Highlighter"
      : toolState.activeTool === "text"
        ? "Text"
        : "Ink";

  const toolRail = (
    <div className={isPresenterMode ? "tool-rail presenter-tool-rail" : "tool-rail"} role="group" aria-label="Teaching tools">
      <div className="rail-tool-group" role="group" aria-label="Move around">
        {teachingTools.slice(0, 2).map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              className={toolState.activeTool === tool.id ? "rail-button active" : "rail-button"}
              key={tool.id}
              type="button"
              title={tool.title}
              aria-label={tool.label}
              aria-pressed={toolState.activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div className="rail-tool-group" role="group" aria-label="Ink tools">
        {teachingTools.slice(2).map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              className={toolState.activeTool === tool.id ? "rail-button active" : "rail-button"}
              key={tool.id}
              type="button"
              title={tool.title}
              aria-label={tool.label}
              aria-pressed={toolState.activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div className="rail-history-actions" role="group" aria-label="Canvas history">
        <button className="rail-action-button" type="button" disabled={!canUndo} onClick={onUndo} title="Undo">
          <Undo2 size={18} />
        </button>
        <button className="rail-action-button" type="button" disabled={!canRedo} onClick={onRedo} title="Redo">
          <Redo2 size={18} />
        </button>
      </div>

      {!isPresenterMode && showsToolSettings && (
        <div className="rail-pen-settings" aria-label="Active tool settings">
          <span className="rail-setting-label">{activeColorLabel}</span>
          <label className="tool-setting color-setting">
            <input
              title={toolState.activeTool === "highlighter" ? "Highlighter color" : "Pen color"}
              aria-label={toolState.activeTool === "highlighter" ? "Highlighter color" : "Pen color"}
              type="color"
              value={activeColorValue}
              onChange={(event) => onPenColorChange(event.target.value)}
              className="color-picker-input"
            />
          </label>
          <span className="rail-setting-label">{activeSizeLabel}</span>
          <label className="tool-setting">
            <input
              title={toolState.activeTool === "text" ? "Text size" : "Stroke width"}
              aria-label={toolState.activeTool === "text" ? "Text size" : "Stroke width"}
              max={toolState.activeTool === "text" ? "48" : "28"}
              min="1"
              type="range"
              value={activeSizeValue}
              onChange={(event) => onPenWidthChange(Number(event.target.value))}
            />
          </label>
        </div>
      )}

      {!isPresenterMode && (
        <div className="rail-danger-zone" role="group" aria-label="Destructive canvas actions">
          <button className="rail-action-button danger" type="button" disabled={!hasObjects} onClick={onClear} title="Clear annotations">
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isPresenterMode && (
        <header className="board-topbar" aria-label="Project actions">
          <div className="board-brand">
            <div className="brand-logo">
              <img src="/icons/app-icon.png" alt="" aria-hidden="true" />
            </div>
            <span className="brand-title">{projectTitle || "Untitled Lesson"}</span>
          </div>
          
          <div className={`save-badge save-badge-${saveStatus.toLowerCase().replace(/\s+/g, "-")}`}>
            {saveStatus}
          </div>

          <div className="topbar-actions" aria-label="Lesson actions">
            <div className="topbar-group" role="group" aria-label="File actions">
              <button className="icon-button" type="button" onClick={onOpenProject} title="Open Project">
                <FolderOpen size={18} />
              </button>
              <button className="icon-button" type="button" onClick={onSaveProject} title="Save Project">
                <Save size={18} />
              </button>
            </div>
            
            <div className="topbar-group" role="group" aria-label="Import actions">
              <button className="icon-button" type="button" onClick={onImportImage} title="Import Image">
                <ImageIcon size={18} />
              </button>
              <button className="icon-button" type="button" onClick={onImportPdf} title="Import PDF">
                <FileText size={18} />
              </button>
            </div>
            
            <div className="topbar-group" role="group" aria-label="Export actions">
              <button className="text-button" type="button" onClick={onExportPng}>PNG</button>
              <button className="text-button" type="button" onClick={onExportPdf}>PDF</button>
            </div>

            <button className="presenter-toggle-button" type="button" onClick={onTogglePresenterMode}>
              <Play size={16} fill="currentColor" />
              <span>Presenter</span>
            </button>
          </div>
        </header>
      )}

      {isPresenterMode && (
        <div className="presenter-live-bar" aria-label="Presenter controls">
          <div className="presenter-brand">
            <img src="/icons/app-icon.png" alt="" aria-hidden="true" />
          </div>
          <div className="presenter-nav" role="group" aria-label="Presenter page navigation">
            <button className="nav-icon-button" type="button" disabled={!canGoPreviousPage} onClick={onPreviousPage}>
              <ChevronLeft size={20} />
            </button>
            <span className="nav-label" aria-live="polite">
              {pagePositionLabel}
            </span>
            <button className="nav-icon-button" type="button" disabled={!canGoNextPage} onClick={onNextPage}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="exit-presenter-button" type="button" onClick={onTogglePresenterMode}>
            <LogOut size={16} />
            <span>Exit</span>
          </button>
        </div>
      )}

      {toolRail}
    </>
  );
}
