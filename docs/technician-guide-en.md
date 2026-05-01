# 帙雲 (Zhiyun) — Technician & Platform Monitoring Guide

> **Language:** English | [粵語版本 → technician-guide-yue.md](./technician-guide-yue.md)

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Key Files and Their Roles](#2-key-files-and-their-roles)
3. [Checking Trigger Health](#3-checking-trigger-health)
4. [Diagnosing Common Issues](#4-diagnosing-common-issues)
5. [Reading Apps Script Execution Logs](#5-reading-apps-script-execution-logs)
6. [Managing System Properties](#6-managing-system-properties)
7. [Re-initialising the System](#7-re-initialising-the-system)
8. [Drive API Quota and Limitations](#8-drive-api-quota-and-limitations)
9. [Email Domain Configuration](#9-email-domain-configuration)
10. [Security Considerations](#10-security-considerations)
11. [Backup and Recovery](#11-backup-and-recovery)
12. [Monitoring Checklist](#12-monitoring-checklist)

---

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                  Google Apps Script                    │
│                                                        │
│  code.gs        — Main logic (triggers, Web App)       │
│  setup.gs       — Installation wizard (installZhiyun) │
│  record.gs      — Record-view data provider           │
│  Index.html     — Teacher Control Panel UI            │
│  homework.html  — Homework assignment UI              │
│  record.html    — Submission status dashboard UI      │
└──────────────────────────┬─────────────────────────────┘
                           │ reads / writes
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼───────┐
    │  Google     │ │  Google     │ │  Google     │
    │  Drive      │ │  Sheets     │ │  Sheets     │
    │  (4 folders)│ │ 繳交紀錄表  │ │ 自動共用表  │
    └─────────────┘ └─────────────┘ └─────────────┘
                            │
                    ┌───────▼───────┐
                    │  Google       │
                    │  Sheets       │
                    │  逾期名單     │
                    └───────────────┘
```

### Data flow summary

1. **Student uploads** file to `1. 上傳課業Link（學生）` (Upload folder).
2. `sortStudentAssignments` (every 1 min) reads filenames, matches class + keyword, moves files to sub-folders in `2. 待批改課業`.
3. Teacher reviews and annotates files; places them in `3. 老師回饋區`.
4. `distributeHomework` (every 15 min) reads filenames in 老師回饋區, matches student + class + keyword, moves files to `4. 已發還課業/{class}/{student}/`.
5. `createFoldersAndUpdateSheet` (every 5 min) scans Drive folders vs record sheet, creates missing folders, updates submission status cells (colour + text).
6. `autoShareStudentFolders` (every 5 min) reads the auto-share sheet, shares the student folder with `{studentId}@ccckyc.edu.hk` using Drive API v3.
7. `generateOverdueAssignments` (every 1 min) compares status cells vs deadline dates; writes overdue rows to the overdue sheet.

---

## 2. Key Files and Their Roles

| File | Role |
|------|------|
| `code.gs` | All business logic, triggers, `doGet()` Web App entry point, `installZhiyun()` |
| `setup.gs` | Duplicate of install logic used as reference (may be merged with `code.gs`) |
| `record.gs` | Supplies `classData` to the record dashboard template |
| `Index.html` | Teacher control panel — rendered at Web App root URL |
| `homework.html` | Homework assignment form — rendered at `?page=homework` |
| `record.html` | Submission status table — rendered at `?page=record` |

### User Properties (stored per Google account)

These are set during installation and are required for all automated functions:

| Property Key | Value |
|-------------|-------|
| `IS_INSTALLED` | `"true"` once installed |
| `UPLOAD_FOLDER_ID` | Drive ID of `1. 上傳課業Link（學生）` |
| `PENDING_FOLDER_ID` | Drive ID of `2. 待批改課業` |
| `FEEDBACK_FOLDER_ID` | Drive ID of `3. 老師回饋區` |
| `RETURNED_FOLDER_ID` | Drive ID of `4. 已發還課業` |
| `AUTO_SHARE_SHEET_ID` | Spreadsheet ID of auto-share sheet |
| `RECORD_SHEET_ID` | Spreadsheet ID of record/assignment sheet |
| `OVERDUE_SHEET_ID` | Spreadsheet ID of overdue sheet |

---

## 3. Checking Trigger Health

1. Open the installer spreadsheet.
2. Click **「擴充功能」 → 「Apps Script」**.
3. In the Apps Script editor, click the **clock icon** (Triggers) in the left sidebar.
4. You should see **5 active triggers**:

   | Function | Type | Frequency |
   |----------|------|-----------|
   | `sortStudentAssignments` | Time-driven | Every 1 minute |
   | `distributeHomework` | Time-driven | Every 15 minutes |
   | `createFoldersAndUpdateSheet` | Time-driven | Every 5 minutes |
   | `generateOverdueAssignments` | Time-driven | Every 1 minute |
   | `autoShareStudentFolders` | Time-driven | Every 5 minutes |

If any trigger is missing, run **「☁️ 帙雲系統」 → 「🗑️ 清除所有自動觸發器」** from the spreadsheet menu, then reinstall by clicking **「🚀 一鍵初始化系統」** (note: this requires resetting first with **「⚠️ 重置安裝狀態」**).

Alternatively, recreate triggers manually by running `setupTriggers()` from the Apps Script editor:
1. In the editor, select function `setupTriggers` from the function dropdown.
2. Click **Run ▶**.

---

## 4. Diagnosing Common Issues

### Files not being sorted from Upload folder

**Symptoms:** Student files stay in `1. 上傳課業Link（學生）` and do not move.

**Checklist:**
- [ ] Is the `sortStudentAssignments` trigger active? (Check triggers panel)
- [ ] Does the filename contain a valid class name (e.g. `1A`, `2B`)? Files without a matching class name are skipped.
- [ ] Is there a folder in `2. 待批改課業` with exactly that class name?
- [ ] Check the Apps Script execution log for errors (see Section 5).

---

### Submission status not updating

**Symptoms:** Students have uploaded files, but the record sheet still shows 🔴 未繳交.

**Checklist:**
- [ ] Is `createFoldersAndUpdateSheet` trigger active?
- [ ] Does the file appear in the correct sub-folder under `2. 待批改課業`?
- [ ] Does the folder ID in row 3 of the record sheet match the actual Drive folder?
- [ ] Does the student name in column A exactly match the name in the filename?

---

### Student folder not being shared

**Symptoms:** Column C of the auto-share sheet remains empty or shows `"共用失敗"`.

**Checklist:**
- [ ] Is the Drive API v3 advanced service enabled? (Apps Script → Services)
- [ ] Is the student ID in column A correct (no extra spaces)?
- [ ] Is the student's Google account active under the `ccckyc.edu.hk` domain?
- [ ] Is the student folder created in `4. 已發還課業/{class}/{student}/`?

---

### Homework not being returned to students

**Symptoms:** Teacher places file in `3. 老師回饋區` but it does not appear in the student's folder.

**Checklist:**
- [ ] Does the filename contain both the class name and student name?
- [ ] Is the `distributeHomework` trigger active?
- [ ] Does the matching student folder exist in `4. 已發還課業`?
- [ ] Run **手動發還課業** from the control panel and check for error messages.

---

### Web App returns "系統尚未初始化"

**Cause:** The `UPLOAD_FOLDER_ID` User Property is missing — installation was not completed.

**Fix:** Run `installZhiyun()` from the spreadsheet menu (reset first if needed).

---

## 5. Reading Apps Script Execution Logs

1. Open the Apps Script editor.
2. Click the **"Executions"** icon (play ▶ with clock) in the left sidebar.
3. You will see a list of recent trigger executions with status (Completed / Failed).
4. Click any execution to expand and see the full log output and any error messages.

**Common error types:**

| Error | Likely Cause |
|-------|-------------|
| `Exception: No item with the given ID` | A stored folder/sheet ID is invalid (deleted or moved) |
| `Exception: DriveApp access not granted` | The script needs to be re-authorised |
| `Exception: Access denied` | Drive API v3 not enabled, or permissions issue |
| `RangeError: Maximum call stack` | Recursive folder scan hit too many levels |

---

## 6. Managing System Properties

To view or edit stored property values:

1. In the Apps Script editor, click the **⚙️ Project Settings** gear icon.
2. Select **「Script properties」** — note: User Properties (used by this system) are different from Script Properties.

To view **User Properties** programmatically, run this in the Apps Script console:

```javascript
function debugProps() {
  const p = PropertiesService.getUserProperties().getProperties();
  console.log(JSON.stringify(p, null, 2));
}
```

To manually set a property (e.g. after a folder was accidentally deleted and recreated):

```javascript
function fixProp() {
  PropertiesService.getUserProperties().setProperty('UPLOAD_FOLDER_ID', 'NEW_FOLDER_ID_HERE');
}
```

---

## 7. Re-initialising the System

If the system needs to be fully reinstalled (e.g. after accidental deletion of core files):

1. Open the installer spreadsheet.
2. Click **「☁️ 帙雲系統」 → 「⚠️ 重置安裝狀態 (出錯時使用)」**.
3. This clears all User Properties.
4. Click **「🚀 一鍵初始化系統」** to reinstall.

> ⚠️ **Warning:** Re-installation creates brand new Google Drive folders and spreadsheets. Any existing homework records and student folder URLs stored in the old sheets will not be automatically migrated. Back up the old data before resetting.

---

## 8. Drive API Quota and Limitations

The system relies on the Google Drive API. Google enforces the following limits:

| Limit | Value |
|-------|-------|
| Drive API calls per day | 1,000,000,000 (consumer) |
| File moves per execution | ~500 recommended |
| Trigger execution time limit | 6 minutes per execution |
| Simultaneous triggers | Cannot run < 1 minute interval reliably |

**Practical limits for this system:**
- For very large classes (100+ students), the `createFoldersAndUpdateSheet` function may occasionally hit the 6-minute execution limit. Monitor the execution log for `Exceeded maximum execution time` errors.
- The `autoShareStudentFolders` function calls `Drive.Permissions.create` for each unshared student — if there are many new students, it may take multiple 5-minute cycles to complete.

---

## 9. Email Domain Configuration

The system is currently configured for the domain `ccckyc.edu.hk`.

If deploying for a different school, update the following locations in `code.gs`:

| Line(s) | Current value | Update to |
|---------|--------------|-----------|
| `autoShareStudentFolders()` | `` `${studentId}@ccckyc.edu.hk` `` | Your school's domain |
| `generateOverdueAssignments()` | `` `${row[0]}@ccckyc.edu.hk` `` | Your school's domain |

After editing, save and redeploy the Web App (new deployment version).

---

## 10. Security Considerations

| Area | Current setting | Recommendation |
|------|----------------|----------------|
| Control panel access | "Anyone" or "Domain" | Use "Domain only" to restrict to school accounts |
| Student submission access | "Anyone including anonymous" | Acceptable for student convenience |
| Teacher control panel URL | Shared URL | Do not publish publicly; share only with teachers |
| Script authorisation | Single teacher account | The script runs as the account that deployed it — use a dedicated school service account if possible |
| Student data in sheets | Stored in Drive | Ensure the sheets are not publicly shared |

---

## 11. Backup and Recovery

### What to back up

| Item | How to back up |
|------|---------------|
| `帙雲 - 繳交紀錄及課業佈置` | Download as `.xlsx` regularly |
| `帙雲 - 自動共用、收集位址` | Download as `.xlsx` — contains all student IDs and folder URLs |
| `帙雲 - OverdueAssignments` | Download as needed |
| Apps Script code | Export from Apps Script editor → **Project overview → Download** |

### If a folder is accidentally deleted

1. Check Google Drive **Trash** — files are retained for 30 days.
2. If the folder ID has changed (e.g. was deleted and recreated), update the corresponding User Property using the `fixProp()` technique in Section 6.
3. Re-run `createFoldersAndUpdateSheet()` manually to recreate any missing sub-folders.

---

## 12. Monitoring Checklist

Run this checklist weekly:

- [ ] Open the Apps Script Triggers panel — confirm all 5 triggers are present
- [ ] Review the Executions log — check for any `Failed` executions in the past 7 days
- [ ] Open `帙雲 - 自動共用、收集位址` — verify column C has no persistent `"共用失敗"` entries
- [ ] Open `帙雲 - 繳交紀錄及課業佈置` — spot-check submission colours are updating
- [ ] Open `帙雲 - OverdueAssignments` — confirm the list is refreshing (check last row timestamp)
- [ ] Verify Drive storage is not near quota (Settings → Storage in Google Drive)
- [ ] Check that the Web App URL is still accessible (open in incognito browser)

---

*For setup instructions, see [setup-en.md](./setup-en.md).*  
*For teacher instructions, see [teacher-guide-en.md](./teacher-guide-en.md).*  
*For student instructions, see [student-guide-en.md](./student-guide-en.md).*
