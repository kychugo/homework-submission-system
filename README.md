# homework-submission-system

A homework management system for Google Apps Script (Google Workspace).

## Features

- **Student submission panel** (`?page=submit`): Students select their class, name, and homework, then upload files directly from a web UI (no Google Drive link needed).
- **Teacher control panel** (root URL): Assign homework, view submission records, manage categories/subjects, manage auto-share settings, and manually trigger file distribution.
- **布置課業 (Assign Homework)**: Choose class, subject, and category from configurable dropdowns; enter deadline via date picker or manual input.
- **Config panel** (`?page=config`): Add/remove homework categories and subjects without editing code.
- **自動共用管理 (Auto-share panel)** (`?page=autoshare`): Register students for folder sharing via the panel or directly in the Google Sheet.
- **作業繳交紀錄 (Submission records)** (`?page=record`): Visual table showing 已繳交 / 遲交 / 未繳交 status per student per assignment. Deadlines are displayed in `DD/MM/YYYY HH:MM` format.
- **Homework name format**: `「Subject」「Category」Title【Keyword】` (backward-compatible with legacy `「Category」Title【Keyword】` format).

## Deployment

Deploy using Google Apps Script. See [`docs/setup-en.md`](./docs/setup-en.md) or [`docs/setup-yue.md`](./docs/setup-yue.md) for full setup instructions.

## Documentation

| Guide | 粵語 | English |
|-------|------|---------|
| Setup | [setup-yue.md](./docs/setup-yue.md) | [setup-en.md](./docs/setup-en.md) |
| Teacher | [teacher-guide-yue.md](./docs/teacher-guide-yue.md) | [teacher-guide-en.md](./docs/teacher-guide-en.md) |
| Student | [student-guide-yue.md](./docs/student-guide-yue.md) | [student-guide-en.md](./docs/student-guide-en.md) |
| Technician | [technician-guide-yue.md](./docs/technician-guide-yue.md) | [technician-guide-en.md](./docs/technician-guide-en.md) |
