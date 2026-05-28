import type { Board } from "../board/board.types";
import {
  LESSONINK_FILE_APP,
  LESSONINK_FILE_SCHEMA_VERSION,
  type LessonInkFileProjectMetadata,
  type LessonInkFileV1,
  type LessonInkLoadedProject
} from "./lessoninkFile.types";
import { validateLessonInkFile } from "./lessoninkValidator";

function cloneBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

export function createLessonInkFile(
  board: Board,
  projectInput: Partial<LessonInkFileProjectMetadata> = {}
): LessonInkFileV1 {
  const timestamp = new Date().toISOString();
  const project: LessonInkFileProjectMetadata = {
    id: projectInput.id ?? board.id,
    title: projectInput.title ?? board.title,
    createdAt: projectInput.createdAt ?? board.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  return {
    schemaVersion: LESSONINK_FILE_SCHEMA_VERSION,
    app: LESSONINK_FILE_APP,
    project,
    board: {
      ...cloneBoard(board),
      updatedAt: timestamp
    }
  };
}

export function serializeLessonInkFile(
  board: Board,
  projectInput: Partial<LessonInkFileProjectMetadata> = {}
): string {
  return `${JSON.stringify(createLessonInkFile(board, projectInput), null, 2)}\n`;
}

export function deserializeLessonInkFile(contents: string): LessonInkLoadedProject {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  const result = validateLessonInkFile(parsed);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    project: result.file.project,
    board: result.file.board
  };
}

export function sanitizeLessonInkFileName(title: string): string {
  const safeName = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeName || "lessonink-project"}.lessonink`;
}
