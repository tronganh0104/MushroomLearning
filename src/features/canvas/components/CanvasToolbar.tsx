import type { CanvasToolState, ToolType } from "../canvas.types";

interface CanvasToolbarProps {
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
  onTogglePresenterMode: () => void;
}

const spikeTools: Array<{
  id: ToolType;
  label: string;
  title: string;
}> = [
  {
    id: "select",
    label: "Pointer",
    title: "Select/pointer placeholder"
  },
  {
    id: "pen",
    label: "Pen",
    title: "Draw freehand strokes"
  },
  {
    id: "eraser",
    label: "Eraser",
    title: "Erase whole strokes near the cursor"
  }
];

export function CanvasToolbar({
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
  onTogglePresenterMode
}: CanvasToolbarProps) {
  return (
    <div className="board-toolbar" aria-label="Canvas tools">
      <div className="toolbar-group" role="group" aria-label="Project file actions">
        <button className="tool-button" type="button" onClick={onSaveProject}>
          Save Project
        </button>
        <button className="tool-button" type="button" onClick={onOpenProject}>
          Open Project
        </button>
      </div>

      <div className="toolbar-group" role="group" aria-label="Drawing tools">
        {spikeTools.map((tool) => (
          <button
            className={toolState.activeTool === tool.id ? "tool-button active" : "tool-button"}
            key={tool.id}
            type="button"
            title={tool.title}
            aria-pressed={toolState.activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="toolbar-group compact-control" aria-label="Pen settings">
        <label>
          <span>Color</span>
          <input
            type="color"
            value={toolState.penColor}
            onChange={(event) => onPenColorChange(event.target.value)}
          />
        </label>
        <label>
          <span>Width</span>
          <input
            max="18"
            min="1"
            type="range"
            value={toolState.penWidth}
            onChange={(event) => onPenWidthChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="toolbar-group" role="group" aria-label="Canvas history">
        <button className="tool-button" type="button" disabled={!canUndo} onClick={onUndo}>
          Undo
        </button>
        <button className="tool-button" type="button" disabled={!canRedo} onClick={onRedo}>
          Redo
        </button>
        <button className="tool-button danger" type="button" disabled={!hasObjects} onClick={onClear}>
          Clear
        </button>
      </div>

      <button className="tool-button presenter-button" type="button" onClick={onTogglePresenterMode}>
        Presenter
      </button>
    </div>
  );
}
