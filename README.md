# LessonInk Desktop

LessonInk Desktop là ứng dụng bảng trắng desktop ưu tiên offline dành cho giáo viên, gia sư và giảng viên online dạy lớp trực tiếp qua Zoom, Google Meet, Microsoft Teams hoặc các công cụ họp tương tự.

Giáo viên mở LessonInk, chuẩn bị hoặc nhập tài liệu bài học, viết và chú thích trong lúc dạy, chia sẻ cửa sổ LessonInk cho học sinh, sau đó lưu hoặc xuất bài học ngay trên máy.

## Nguyên tắc sản phẩm

- Ưu tiên offline theo mặc định.
- Giáo viên sở hữu file bài học cục bộ của mình.
- MVP không có backend, triển khai cloud, đăng nhập, cộng tác thời gian thực, link cho học sinh tham gia, thanh toán hoặc tính năng AI.
- Luồng sử dụng đầu tiên là giáo viên chia sẻ cửa sổ ứng dụng từ máy tính của mình.
- Độ ổn định và nét viết mượt quan trọng hơn các tính năng cộng tác rộng.

## Phạm vi MVP

- Bảng trắng nhiều trang
- Bút, tẩy, highlight, văn bản và hình cơ bản
- Nhập PDF và hình ảnh
- Pan và zoom
- Chế độ trình bày
- Đồng hồ
- Lưu/tải cục bộ bằng file `.lessonink`
- Tự động lưu cục bộ
- File gần đây
- Xuất PDF/PNG

## Không nằm trong phạm vi

- Tính năng LMS
- Tài khoản học sinh
- Lưu trữ hoặc đồng bộ cloud
- Cộng tác nhiều người theo thời gian thực
- Plugin cho nền tảng họp
- Thanh toán hoặc cấp license
- Tạo giáo án bằng AI

## Chạy trên máy local

Cài các gói phụ thuộc:

```bash
npm install
```

Chạy ứng dụng web local:

```bash
npm run dev
```

Nếu port mặc định `5173` đang bận, Vite sẽ tự thử port kế tiếp. Bạn cũng có thể chạy cố định ở port `5174`:

```bash
npm run dev:5174
```

Build frontend:

```bash
npm run build
```

Chạy unit test:

```bash
npm test
```

Unit test hiện tại tập trung vào logic canvas cốt lõi: pointer input, stroke utilities,
hit testing cho eraser, undo/redo history và board/page state. Repo chưa thêm e2e test.

Chạy Tauri desktop shell sau khi đã cài Rust và các yêu cầu của Tauri:

```bash
npm run tauri dev
```

## Cấu trúc repository hiện tại

```text
lessonink-desktop/
|-- README.md
|-- overview.md
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- index.html
|-- docs/
|   |-- product/
|   |-- technical/
|   |-- decisions/
|-- public/
|   |-- icons/
|-- src/
|   |-- app/
|   |-- pages/
|   |-- features/
|   |-- shared/
|   |-- storage/
|   |-- styles/
|   |-- main.tsx
|-- src-tauri/
|   |-- Cargo.toml
|   |-- tauri.conf.json
|   |-- build.rs
|   |-- src/
|-- tests/
    |-- unit/
    |-- e2e/
```

## Ghi chú kiến trúc

Ứng dụng được tổ chức theo từng nhóm tính năng sản phẩm. Các khái niệm cốt lõi của việc dạy học nằm trong `src/features`, UI và tiện ích dùng chung nằm trong `src/shared`, còn ranh giới lưu trữ cục bộ nằm trong `src/storage`.

Tài liệu sản phẩm và kỹ thuật nằm trong `docs/`. Nguồn sự thật sản phẩm chính vẫn là `overview.md`.
