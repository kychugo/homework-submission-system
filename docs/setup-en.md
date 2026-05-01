# 帙雲 (Zhiyun) — Setup, Deployment & Student Onboarding Guide

> **Language:** English | [粵語版本 → setup-yue.md](./setup-yue.md)

> **Updated for:** student submission panel, category config panel, auto-share management panel, simplified deadline display, any-format file support.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Get the Installer File](#3-step-1--get-the-installer-file)
4. [Step 2 — One-Click System Installation](#4-step-2--one-click-system-installation)
5. [Step 3 — Deploy the Web App (Control Panel)](#5-step-3--deploy-the-web-app-control-panel)
6. [Step 4 — Deploy the Student Submission App](#6-step-4--deploy-the-student-submission-app)
7. [Step 5 — Set Up Student Accounts (Auto-Share)](#7-step-5--set-up-student-accounts-auto-share)
8. [Step 6 — Populate the Class & Student List](#8-step-6--populate-the-class--student-list)
9. [System Folder & File Structure](#9-system-folder--file-structure)
10. [Quick-Reference Checklist](#10-quick-reference-checklist)

---

## 1. System Overview

**帙雲 (Zhiyun)** is a Google Apps Script–based homework management system. It automates:

- Collecting student homework uploaded to a shared Google Drive folder.
- Sorting files into per-class, per-subject sub-folders.
- Returning teacher-annotated files to individual student folders.
- Auto-sharing each student's personal "returned homework" folder and recording its URL.
- Publishing submission status (submitted / late / not submitted) on a dashboard.

The system runs entirely inside **your school Google Account** — no external servers or third-party services are required.

---

## 2. Prerequisites

| Item | Requirement |
|------|-------------|
| Google Account | A school Google account (e.g. `teacher@ccckyc.edu.hk`) |
| Google Drive API | Advanced Drive Service (`Drive API v3`) must be enabled in the Apps Script project |
| Browser | Any modern browser (Chrome recommended) |
| Student email format | `{studentId}@ccckyc.edu.hk` (e.g. `s12345@ccckyc.edu.hk`) |

> **Note:** If your school uses a different email domain, you must update the domain string `ccckyc.edu.hk` in `code.gs` before deploying.

---

## 3. Step 1 — Get the Installer File

1. Open the installation link:  
   **[https://docs.google.com/spreadsheets/d/1DQJJtCdoO6WFrUV3nHxj4OYfBVqJeGz8tIRK84UtatM/copy](https://docs.google.com/spreadsheets/d/1DQJJtCdoO6WFrUV3nHxj4OYfBVqJeGz8tIRK84UtatM/copy)**

2. Google will prompt you to **"Create a copy"**. Click it.  
   The installer spreadsheet will be copied to your own Google Drive.

---

## 4. Step 2 — One-Click System Installation

1. Open the spreadsheet you just copied.
2. In the top menu, click **「☁️ 帙雲系統」 → 「🚀 一鍵初始化系統」**.

### First-time authorisation (Google security prompt)

Because this is a privately developed script, Google will show an authorisation dialog on first run:

| Prompt | Action |
|--------|--------|
| "Google hasn't verified this app" warning | Click **Advanced** (bottom-left) |
| Link "Go to '(your project name)' (unsafe)" | Click it |
| Permission list | Click **Allow** |

3. After authorising, click **「☁️ 帙雲系統」 → 「🚀 一鍵初始化系統」** again.
4. Wait approximately **1 minute**.
5. A success dialog will appear: *"✅ 系統建構成功！"*

### What gets created automatically

After installation, the following items are created in your Google Drive:

```
📁 帙雲/
├── 1. 上傳課業Link（學生）     ← Students upload here
├── 2. 待批改課業               ← System sorts files here
├── 3. 老師回饋區               ← Teacher places annotated files here
├── 4. 已發還課業               ← System moves annotated files to students
├── 帙雲 - 自動共用、收集位址    ← Student account management sheet
├── 帙雲 - 繳交紀錄及課業佈置   ← Homework assignment & submission record
├── 帙雲 - OverdueAssignments   ← Auto-generated overdue list
└── (Installer spreadsheet)
```

The installer spreadsheet now shows links to each of these items for easy access.

### Automated background triggers set up

| Trigger | Frequency | Purpose |
|---------|-----------|---------|
| `sortStudentAssignments` | Every 1 min | Moves uploaded files from "上傳區" to "待批改課業" |
| `createFoldersAndUpdateSheet` | Every 5 min | Creates per-student folders; updates submission status |
| `autoShareStudentFolders` | Every 5 min | Shares individual folders with students |
| `distributeHomework` | Every 15 min | Moves teacher feedback to students' "已發還課業" |
| `generateOverdueAssignments` | Every 1 min | Refreshes the overdue assignments report |

---

## 5. Step 3 — Deploy the Web App (Control Panel)

The teacher control panel is served as a Google Apps Script **Web App**.

1. Open the installer spreadsheet.
2. In the top menu, click **「擴充功能」 (Extensions) → 「Apps Script」**.
3. In the Apps Script editor, click the blue **「部署」 (Deploy)** button (top-right) → **「新增部署作業」 (New deployment)**.
4. Click the ⚙️ gear icon next to **"Select type"** → choose **「網頁應用程式」 (Web App)**.
5. Fill in the settings:

   | Field | Value |
   |-------|-------|
   | Description | `版本1` (or any label) |
   | Execute as | **Me** (your school email) |
   | Who has access | **Anyone** (including anonymous) *or* **Anyone in your domain** |

6. Click **「部署」 (Deploy)**.
7. Copy the **Web App URL** displayed — this is your **Teacher Control Panel**. Bookmark it.

> **Security tip:** Choose "Anyone in your domain" if you want to restrict access to school accounts only.

---

## 6. Step 4 — Find the Student Submission URL

The student submission panel is built into the **same Web App** as the teacher control panel. After deploying the Web App (Step 3), you will find the student submission URL displayed prominently at the bottom of the teacher control panel dashboard:

> **Student Submission URL:** `{your Web App URL}?page=submit`

To share it:
1. Open your Teacher Control Panel URL in a browser.
2. At the bottom of the page, look for the **"學生繳交連結"** (Student Submission Link) section.
3. Copy that URL and share it with your students (e.g., via email, class notice board, or LMS).

> **Important:** Share **only** the `?page=submit` URL with students.  
> Do **not** share the root Control Panel URL or the `?page=homework` URL.

---

## 7. Step 5 — Set Up Student Accounts (Auto-Share)

For each student to receive their personal "returned homework" folder, you must register them in the system. You can do this in **two ways**:

### Option A — Auto-Share Management Panel (New)

1. Open the Teacher Control Panel.
2. Click **「自動共用管理」**.
3. In the form at the bottom, enter the student's **学号 (Student ID)** and **姓名 (Name)**, then click **「新增」**.
4. To run the share process immediately, click **「立即執行共用」**.

### Option B — Edit the Spreadsheet Directly

1. Open **「帙雲 - 自動共用、收集位址」** from the installer spreadsheet or your Google Drive.
2. The sheet has three columns:

   | Column A | Column B | Column C |
   |----------|----------|----------|
   | 學號 (Student ID) | 姓名 (Name) | 專屬文件夾位址 (Folder URL — auto-filled) |

3. Enter each student's **student number** (e.g. `s12345`) in column A and their **full name** in column B (must match the name in the record sheet exactly).
4. Column C is filled automatically within 5 minutes by the `autoShareStudentFolders` trigger.

If column C shows `"共用失敗: ..."`, check that:
- The student ID and email domain are correct.
- The student's Google account exists.
- The Apps Script project has the **Drive API v3** advanced service enabled.

### Enable Drive API v3 (if not already enabled)

1. In the Apps Script editor, click **「服務」 (Services)** (left sidebar, `+` icon).
2. Find **"Drive API"** → select version **v3** → click **Add**.

---

## 8. Step 6 — Populate the Class & Student List

The submission record and folder structure are driven by the **「帙雲 - 繳交紀錄及課業佈置」** spreadsheet.

### Sheet structure (one sheet tab per class)

| Cell | Content |
|------|---------|
| A1 | Class name (e.g. `1A`) — also the tab name |
| B1, C1, D1 … | Homework names (auto-formatted: `「科目」「類別」作業名稱【關鍵詞】`) |
| B2, C2, D2 … | Deadlines (format: `YYYY-MM-DD HH:MM`) |
| B3, C3, D3 … | Folder IDs (auto-filled by system — do not edit) |
| A4, A5, A6 … | Student names (must match exactly what is in the auto-share sheet) |
| B4 onwards | Submission status (auto-filled: `已繳交` / `遲交` / `未繳交`) |

### How to add a new class

1. In the record spreadsheet, click **+** (bottom) to add a new sheet tab.
2. Name the tab with the class name (e.g. `2B`).
3. In cell **A1**, type the same class name (`2B`).
4. In cell **A4** and below, list all student names for that class.
5. The system will automatically create the corresponding folders within 5 minutes.

---

## 9. System Folder & File Structure

```
📁 帙雲/
│
├── 1. 上傳課業Link（學生）/
│   └── (Student uploads go here — named: ClassNameStudentNameKeyword.ext)
│
├── 2. 待批改課業/
│   └── 1A/
│       ├── 閱讀/               ← Category (configurable via 課業類別設定 panel)
│       │   └── HomeworkTitle/
│       ├── 寫作（長文）/
│       │   └── HomeworkTitle/
│       └── (any custom categories you add)
│
├── 3. 老師回饋區/
│   └── (Teacher places annotated files here)
│
└── 4. 已發還課業/
    └── 【1A】/
        └── 【StudentName】/
            ├── 閱讀/
            ├── 寫作（長文）/
            │   └── HomeworkTitle/
            └── (custom categories)
```

> The category list is now fully configurable from the **「課業類別設定」** panel in the teacher control panel. The default categories are `閱讀`, `寫作（長文）`, and `寫作（實用文）`.

---

## 10. Quick-Reference Checklist

- [ ] Copy installer spreadsheet to your Google Drive
- [ ] Run "一鍵初始化系統" and complete Google authorisation
- [ ] Verify `📁 帙雲` folder and all sub-items were created
- [ ] Deploy Web App → save Teacher Control Panel URL
- [ ] Deploy second Web App for students → save Student Submission URL
- [ ] Enable Drive API v3 in Apps Script Services
- [ ] Fill in student IDs and names in "自動共用、收集位址" sheet
- [ ] Add class tabs and student names to "繳交紀錄及課業佈置" sheet
- [ ] Wait 5 minutes; verify student folders appear in "已發還課業"
- [ ] Verify column C of "自動共用、收集位址" is populated with folder URLs
- [ ] Share the Student Submission URL with all students
- [ ] Share the Teacher Control Panel URL only with teachers

---

*For teacher usage instructions, see [teacher-guide-en.md](./teacher-guide-en.md).*  
*For student usage instructions, see [student-guide-en.md](./student-guide-en.md).*  
*For system monitoring, see [technician-guide-en.md](./technician-guide-en.md).*
