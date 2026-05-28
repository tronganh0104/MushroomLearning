import type { Board } from "../board/board.types";

export const LESSONINK_FILE_APP = "LessonInk";
export const LESSONINK_FILE_SCHEMA_VERSION = 1;
export const LESSONINK_FILE_EXTENSION = ".lessonink";
export const LESSONINK_FILE_MIME_TYPE = "application/vnd.lessonink+json";

export interface LessonInkFileProjectMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonInkFileV1 {
  schemaVersion: typeof LESSONINK_FILE_SCHEMA_VERSION;
  app: typeof LESSONINK_FILE_APP;
  project: LessonInkFileProjectMetadata;
  board: Board;
}

export interface LessonInkLoadedProject {
  project: LessonInkFileProjectMetadata;
  board: Board;
}

export type LessonInkValidationResult =
  | {
      ok: true;
      file: LessonInkFileV1;
    }
  | {
      ok: false;
      error: string;
    };
