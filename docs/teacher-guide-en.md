# 帙雲 (Zhiyun) — Teacher Usage Guide

> **Language:** English | [粵語版本 → teacher-guide-yue.md](./teacher-guide-yue.md)

---

## Table of Contents

1. [Accessing the Control Panel](#1-accessing-the-control-panel)
2. [Assigning Homework](#2-assigning-homework)
3. [Monitoring Submission Status](#3-monitoring-submission-status)
4. [Reviewing Submitted Homework](#4-reviewing-submitted-homework)
5. [Annotating & Returning Homework](#5-annotating--returning-homework)
6. [Manually Triggering a Return](#6-manually-triggering-a-return)
7. [Managing Classes and Students](#7-managing-classes-and-students)
8. [Viewing the Overdue List](#8-viewing-the-overdue-list)
9. [Homework Category & Subject Configuration](#9-homework-category--subject-configuration)
10. [Quick Reference](#10-quick-reference)

---

## 1. Accessing the Control Panel

The teacher control panel is a web page served from your Google Apps Script deployment.

1. Open the **Teacher Control Panel URL** (bookmarked during setup).
2. You will see the following sections:

   | Button | Destination |
   |--------|-------------|
   | 學生上傳區 | Google Drive folder where students upload files |
   | 待批改課業 | Sorted, pending-review homework files |
   | 老師回饋區 | Where you place annotated files before returning |
   | 已發還課業 | Student personal folders with returned work |
   | 繳交紀錄查閱 | Visual submission status table |
   | 課業設置 | Homework assignment panel |
   | 底層：繳交/佈置表 | Direct link to the underlying Google Sheet |
   | 手動發還課業 | Button to immediately trigger the return process |
   | 課業類別設定 | Add or remove homework categories |
   | 自動共用管理 | Add/remove students from the auto-share list |

3. At the bottom of the page, the **Student Submission Link** (`?page=submit`) is displayed. Share this URL with your students — do **not** share the root control panel URL.

---

## 2. Assigning Homework

### Using the Homework Assignment Panel

1. From the Control Panel, click **「課業設置」 (Homework Setup)**.
2. Fill in the form:

   | Field | Description |
   |-------|-------------|
   | 選擇班別 | Select the class (e.g. `1A`, `2B`) |
   | 選擇課業類別 | Choose a category from the dropdown. Categories can be managed in **「課業類別設定」** (see [Section 9](#9-homework-category--subject-configuration)). |
   | 課業名稱 | Enter the full homework title (e.g. `藏在泥土的寶物`) |
   | 關鍵詞 | Enter a keyword that is part of the homework name (e.g. `寶物`) — students must include this in their filename |
   | 截止日期和時間 | Pick a date and time using the **date picker**, or type directly in the text field below it (format `YYYY-MM-DD HH:MM`, e.g. `2025-04-24 23:59`) |

3. Click **「提交」**. A confirmation modal will appear showing all entered details.
4. Click **「確定」** to confirm, or **「取消」** to go back and edit.

After confirmation, the homework is written to the **「帙雲 - 繳交紀錄及課業佈置」** sheet and the corresponding Drive folders are created within 5 minutes.

### Deadline format

The system accepts deadlines in the format `YYYY-MM-DD HH:MM` using 24-hour time:

```
2025-04-24 23:59   ← 24 April 2025, 11:59 PM
2025-06-01 08:00   ← 1 June 2025, 8:00 AM
```

You can type the numbers directly — the form will auto-format them.

### How the homework name is formatted

After submission, the system formats the homework name as:

```
「Category」HomeworkTitle【Keyword】
```

**Example:**
- Category: `寫作（長文）`
- Title: `藏在泥土的寶物`
- Keyword: `寶物`
- Result: `「寫作（長文）」藏在泥土的寶物【寶物】`

This formatted name is used to create the corresponding Drive folder and to match student-submitted files.

### Directly editing the record sheet

You may also assign homework by editing the **「帙雲 - 繳交紀錄及課業佈置」** sheet directly:

1. Open the sheet (linked from the Control Panel → "底層：繳交/佈置表").
2. Navigate to the sheet tab for the target class (e.g. `1A`).
3. In the next empty column (starting from column B):
   - **Row 1**: Enter the formatted homework name (e.g. `「閱讀」作業名稱【關鍵詞】`)
   - **Row 2**: Enter the deadline (e.g. `2025-04-24 23:59`)
4. Do **not** edit Row 3 (folder IDs — auto-managed).

---

## 3. Monitoring Submission Status

### Submission Record Dashboard

1. From the Control Panel, click **「繳交紀錄查閱」**.
2. Click a class button to show its table.
3. The table shows each student's status for every assignment:

   | Colour | Status |
   |--------|--------|
   | 🟢 Green | Submitted on time (已繳交) |
   | 🟡 Yellow | Submitted late (遲交) |
   | 🔴 Red | Not yet submitted (未繳交) |

The table is updated every **5 minutes** automatically.

### Underlying record sheet

For a more detailed view, open the **「帙雲 - 繳交紀錄及課業佈置」** sheet directly. The colour-coded cells provide the same information and can be filtered or exported.

---

## 4. Reviewing Submitted Homework

All student-submitted files are automatically sorted into the **「2. 待批改課業」** folder structure:

```
2. 待批改課業/
└── 1A/
    ├── 閱讀/
    │   └── HomeworkKeyword/
    │       └── 1A陳大文寶物.pdf
    ├── 寫作（長文）/
    │   └── HomeworkKeyword/
    └── 寫作（實用文）/
```

1. Open **「待批改課業」** from the Control Panel.
2. Navigate to the class and subject folder.
3. Open and review each student's file.

---

## 5. Annotating & Returning Homework

After marking a student's file, place the annotated version in the **「3. 老師回饋區」** folder. The system will automatically move it to the student's personal folder in **「4. 已發還課業」** within 15 minutes.

### File naming for returned files

For the system to route the file correctly, the filename should contain:
- The **class name** (e.g. `1A`)
- The **student's name** (e.g. `陳大文`)
- Optionally, the **homework keyword** (e.g. `寶物`) — if included, the file is placed in the specific homework sub-folder

**Examples:**

| File name | Where it goes |
|-----------|--------------|
| `1A陳大文寶物批改.pdf` | `【1A】/【陳大文】/寫作（長文）/HomeworkTitle/` |
| `1A陳大文.pdf` | `【1A】/【陳大文】/` (student root folder) |
| `1A.pdf` | `【1A】/` (class root folder) |

---

## 6. Manually Triggering a Return

The return process runs automatically every 15 minutes. To run it immediately:

**Via the Control Panel:**
1. Click the **「手動發還課業」** button on the Control Panel.
2. The button will show "正在發還中..." while processing.
3. A success or error message will appear when complete.

**Via the spreadsheet menu:**
1. Open the installer spreadsheet.
2. Click **「☁️ 帙雲系統」 → 「📤 手動立即發還課業」**.

---

## 7. Managing Classes and Students

### Adding a new class

1. Open **「帙雲 - 繳交紀錄及課業佈置」**.
2. Click **+** to add a new sheet tab; name it with the class name (e.g. `2B`).
3. In cell **A1**, enter the class name (`2B`).
4. In **A4** onwards, enter student names (one per row).

### Adding students to an existing class

1. Open the class sheet tab.
2. Add the student's name in the next empty row in column A (from row 4 onwards).
3. Also add the student to **「帙雲 - 自動共用、收集位址」** (column A = student ID, column B = full name) so their personal folder is shared.

### Removing students

It is recommended to leave student names in the sheet for record-keeping. Simply removing them from column A will stop the system from creating or updating their submission records.

---

## 8. Viewing the Overdue List

The system maintains an automatically updated overdue list in **「帙雲 - OverdueAssignments」**.

1. Open the file from your Google Drive (inside the `📁 帙雲` folder).
2. The "Overdue Assignments" sheet contains columns:

   | Column | Content |
   |--------|---------|
   | 班別 | Class |
   | 學生姓名 | Student name |
   | 學生電郵 | Student email |
   | 課業名稱 | Assignment name |
   | 截止日期 | Deadline |

This list only shows students who have **not yet submitted** and whose **deadline has passed**. You may use this sheet to follow up with students or send reminders.

---

## 9. Homework Category & Subject Configuration

Currently, the system supports three built-in categories:

| Category | Chinese |
|----------|---------|
| Reading | 閱讀 |
| Long writing | 寫作（長文）|
| Functional writing | 寫作（實用文）|

These categories determine the folder structure within each student's returned homework folder and the "待批改課業" pending folder.

> If you need to add or modify categories, edit the following in `code.gs`:
> - The `categories` array in `createFoldersAndUpdateSheet()`  
> - The options in the homework assignment panel (`homework.html`)

Custom categories can also be added by editing the dropdown in the `homework.html` file. Contact your system technician if you are not comfortable editing code directly.

---

## 10. Quick Reference

| Task | Where to do it |
|------|---------------|
| Assign homework | Control Panel → 課業設置 |
| View submission status | Control Panel → 繳交紀錄查閱 |
| Review pending homework | Control Panel → 待批改課業 |
| Return marked homework | Drop file in 老師回饋區 → system auto-moves it |
| Force immediate return | Control Panel → 手動發還課業 button |
| View overdue students | Open 帙雲 - OverdueAssignments sheet |
| Add a new class | Edit 帙雲 - 繳交紀錄及課業佈置 sheet |
| Register new students | Edit both 帙雲 - 繳交紀錄及課業佈置 and 帙雲 - 自動共用、收集位址 |

---

*For setup instructions, see [setup-en.md](./setup-en.md).*  
*For student instructions, see [student-guide-en.md](./student-guide-en.md).*  
*For system monitoring, see [technician-guide-en.md](./technician-guide-en.md).*
