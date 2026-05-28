import { type ChangeEvent, useRef, useState } from "react";
import { initialCanvasToolState } from "../../canvas/canvas.store";
import { CanvasStage } from "../../canvas/components/CanvasStage";
import { CanvasToolbar } from "../../canvas/components/CanvasToolbar";
import type { CanvasObject, StrokeObject, ToolType } from "../../canvas/canvas.types";
import {
  type CanvasHistoryAction,
  initialCanvasHistoryState,
  recordCanvasHistory,
  redoCanvasHistory,
  undoCanvasHistory
} from "../../canvas/history/canvasHistory";
import {
  downloadLessonInkFile,
  getLessonInkDownloadName,
  readLessonInkFile
} from "../../documents/lessoninkFileService";
import type { LessonInkFileProjectMetadata } from "../../documents/lessoninkFile.types";
import { deserializeLessonInkFile, serializeLessonInkFile } from "../../documents/lessoninkSerializer";
import { PresenterMode } from "../../presenter/PresenterMode";
import { usePresenterStore } from "../../presenter/presenter.store";
import { TimerPanel } from "../../timer/TimerPanel";
import { useBoardState } from "../hooks/useBoardState";

export function BoardShell() {
  const { board, activePage, addPage, replaceBoard, setActivePage, setPageObjects } = useBoardState();
  const { isPresenterMode, togglePresenterMode } = usePresenterStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toolState, setToolState] = useState(initialCanvasToolState);
  const [history, setHistory] = useState(initialCanvasHistoryState);
  const [project, setProject] = useState<LessonInkFileProjectMetadata>(() => ({
    id: board.id,
    title: board.title,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  }));
  const [fileMessage, setFileMessage] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);

  const commitObjects = (
    pageId: string,
    before: CanvasObject[],
    after: CanvasObject[],
    action: CanvasHistoryAction
  ) => {
    setPageObjects(pageId, after);
    setHistory((current) => recordCanvasHistory(current, action, before, after));
  };

  const handleAddStroke = (stroke: StrokeObject) => {
    const before = activePage.objects;
    const after = [...before, stroke];

    commitObjects(activePage.id, before, after, {
      type: "addStroke",
      pageId: activePage.id,
      strokeId: stroke.id
    });
  };

  const handleEraseStrokes = (strokeIds: string[]) => {
    const strokeIdSet = new Set(strokeIds);
    const before = activePage.objects;
    const after = before.filter((object) => !strokeIdSet.has(object.id));

    if (before.length === after.length) {
      return;
    }

    const action: CanvasHistoryAction =
      strokeIds.length === 1
        ? {
            type: "removeStroke",
            pageId: activePage.id,
            strokeId: strokeIds[0]
          }
        : {
            type: "removeStrokes",
            pageId: activePage.id,
            strokeIds
          };

    commitObjects(activePage.id, before, after, action);
  };

  const handleClearCanvas = () => {
    if (activePage.objects.length === 0) {
      return;
    }

    commitObjects(activePage.id, activePage.objects, [], {
      type: "clearCanvas",
      pageId: activePage.id
    });
  };

  const handleUndo = () => {
    const result = undoCanvasHistory(history);

    if (!result) {
      return;
    }

    setPageObjects(result.pageId, result.objects);
    setHistory(result.history);
  };

  const handleRedo = () => {
    const result = redoCanvasHistory(history);

    if (!result) {
      return;
    }

    setPageObjects(result.pageId, result.objects);
    setHistory(result.history);
  };

  const handleSaveProject = () => {
    const contents = serializeLessonInkFile(board, project);

    downloadLessonInkFile(contents, getLessonInkDownloadName(project));
    setFileError(undefined);
    setFileMessage("Project download started.");
  };

  const handleOpenProject = () => {
    fileInputRef.current?.click();
  };

  const handleProjectFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const contents = await readLessonInkFile(file);
      const loadedProject = deserializeLessonInkFile(contents);

      replaceBoard(loadedProject.board);
      setProject(loadedProject.project);
      setHistory(initialCanvasHistoryState);
      setFileError(undefined);
      setFileMessage(`Opened ${file.name}.`);
    } catch (error) {
      setFileMessage(undefined);
      setFileError(error instanceof Error ? error.message : "Could not open the selected LessonInk file.");
    }
  };

  return (
    <section className={isPresenterMode ? "board-page presenter-active" : "board-page"}>
      <aside className="page-sidebar" aria-label="Board pages">
        <div className="sidebar-title">Pages</div>
        {board.pages.map((page) => (
          <button
            className={page.id === board.activePageId ? "page-thumb active" : "page-thumb"}
            key={page.id}
            type="button"
            onClick={() => setActivePage(page.id)}
          >
            {page.title}
          </button>
        ))}
        <button className="secondary-button" type="button" onClick={addPage}>
          Add page
        </button>
      </aside>

      <div className="workspace">
        <CanvasToolbar
          toolState={toolState}
          canUndo={history.undoStack.length > 0}
          canRedo={history.redoStack.length > 0}
          hasObjects={activePage.objects.length > 0}
          onToolChange={(activeTool: ToolType) => setToolState((current) => ({ ...current, activeTool }))}
          onPenColorChange={(penColor) => setToolState((current) => ({ ...current, penColor }))}
          onPenWidthChange={(penWidth) => setToolState((current) => ({ ...current, penWidth }))}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClearCanvas}
          onSaveProject={handleSaveProject}
          onOpenProject={handleOpenProject}
          onTogglePresenterMode={togglePresenterMode}
        />
        <input
          ref={fileInputRef}
          accept=".lessonink,application/json,application/vnd.lessonink+json"
          className="visually-hidden"
          type="file"
          onChange={handleProjectFileSelected}
        />
        {(fileMessage || fileError) && (
          <div
            className={fileError ? "board-file-message error" : "board-file-message"}
            role={fileError ? "alert" : "status"}
          >
            {fileError ?? fileMessage}
          </div>
        )}

        <CanvasStage
          page={activePage}
          toolState={toolState}
          onAddStroke={handleAddStroke}
          onEraseStrokes={handleEraseStrokes}
        />
      </div>

      <aside className="utility-sidebar" aria-label="Teaching utilities">
        <TimerPanel />
        <PresenterMode isPresenterMode={isPresenterMode} />
      </aside>
    </section>
  );
}
