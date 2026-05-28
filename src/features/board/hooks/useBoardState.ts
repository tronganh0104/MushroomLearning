import { useMemo, useState } from "react";
import type { CanvasObject } from "../../canvas/canvas.types";
import { addPage, createBlankBoard, setActivePage, setPageObjects } from "../board.store";

export function useBoardState() {
  const [board, setBoard] = useState(() => createBlankBoard("Live class board"));
  const activePage = useMemo(
    () => board.pages.find((page) => page.id === board.activePageId) ?? board.pages[0],
    [board]
  );

  return {
    board,
    activePage,
    addPage: () => setBoard((current) => addPage(current)),
    replaceBoard: setBoard,
    setActivePage: (pageId: string) => setBoard((current) => setActivePage(current, pageId)),
    setPageObjects: (pageId: string, objects: CanvasObject[]) =>
      setBoard((current) => setPageObjects(current, pageId, objects))
  };
}
