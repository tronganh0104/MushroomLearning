import {
  LESSONINK_FILE_EXTENSION,
  LESSONINK_FILE_MIME_TYPE,
  type LessonInkFileProjectMetadata
} from "./lessoninkFile.types";
import { sanitizeLessonInkFileName } from "./lessoninkSerializer";

export function getLessonInkDownloadName(project: Pick<LessonInkFileProjectMetadata, "title">): string {
  return sanitizeLessonInkFileName(project.title);
}

export function downloadLessonInkFile(contents: string, fileName: string): void {
  const blob = new Blob([contents], { type: LESSONINK_FILE_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName.endsWith(LESSONINK_FILE_EXTENSION) ? fileName : `${fileName}${LESSONINK_FILE_EXTENSION}`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function readLessonInkFile(file: File): Promise<string> {
  return file.text();
}
