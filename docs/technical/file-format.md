# Định dạng file

File dự án LessonInk dùng phần mở rộng `.lessonink`.

## Định dạng MVP

MVP dùng JSON trong file có phần mở rộng `.lessonink`. Canvas không lưu raw pixels hoặc
Konva internal objects; file chỉ lưu domain objects của LessonInk như board, pages và strokes.

```json
{
  "schemaVersion": 1,
  "app": "LessonInk",
  "project": {
    "id": "project-id",
    "title": "Untitled Lesson",
    "createdAt": "2026-05-28T00:00:00.000Z",
    "updatedAt": "2026-05-28T00:00:00.000Z"
  },
  "board": {
    "id": "board-1",
    "title": "Untitled Board",
    "activePageId": "page-1",
    "pages": [
      {
        "id": "page-1",
        "title": "Page 1",
        "index": 0,
        "background": {
          "type": "blank",
          "color": "#ffffff"
        },
        "objects": [],
        "createdAt": "2026-05-28T00:00:00.000Z",
        "updatedAt": "2026-05-28T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-05-28T00:00:00.000Z",
    "updatedAt": "2026-05-28T00:00:00.000Z"
  }
}
```

### Stroke object v0.4

Stroke objects are stored as structured data:

```json
{
  "id": "stroke-1",
  "pageId": "page-1",
  "kind": "stroke",
  "type": "stroke",
  "tool": "pen",
  "points": [
    {
      "x": 12,
      "y": 24,
      "inputType": "pen",
      "pressure": 0.5
    }
  ],
  "color": "#111827",
  "opacity": 1,
  "width": 4,
  "x": 0,
  "y": 0,
  "rotation": 0,
  "locked": false,
  "createdAt": "2026-05-28T00:00:00.000Z",
  "updatedAt": "2026-05-28T00:00:00.000Z"
}
```

`pressure` is optional and preserved when present. The v0.4 browser workflow saves via Blob
download and opens via file upload so development can work before Tauri filesystem APIs are ready.

## Định dạng tương lai

Nếu hình ảnh nhúng và trang PDF đã render khiến một file JSON đơn lẻ trở nên quá lớn, có thể chuyển sang định dạng package nén:

- `project.json`
- `assets/images/*`
- `assets/pdf-pages/*`
- `metadata.json`
