# Zhiyun Homework System — Platform Monitoring & Technical Maintenance Guide (English)

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Monitoring Automatic Triggers](#2-monitoring-automatic-triggers)
3. [Reading Error Logs](#3-reading-error-logs)
4. [Google Drive Folder Health Check](#4-google-drive-folder-health-check)
5. [Spreadsheet Monitoring](#5-spreadsheet-monitoring)
6. [Common Issues & Solutions](#6-common-issues--solutions)
7. [System Reset Procedures](#7-system-reset-procedures)
8. [Security Notes](#8-security-notes)
9. [System Properties Reference](#9-system-properties-reference)

---

## 1. System Architecture Overview

### Main System (Teacher App)
- **Platform:** Google Apps Script (.gs files + HTML templates)
- **Triggers:** 5 time-based automatic triggers (see Section 2)
- **Storage:** Google Drive (folders) + Google Sheets (spreadsheets) + UserProperties (system settings)

### Student Submission App (separate deployment)
- **Platform:** Independent Google Apps Script web app
- **Triggers:** None (runs on-demand only)
- **Storage:** Uses the main system's `UPLOAD_FOLDER_ID` folder in Drive

### Data Flow
```
Student upload → Upload folder → [sortStudentAssignments every 1 min] → Pending Homework
Teacher marks → Teacher Feedback → [distributeHomework every 15 min] → Returned Homework
Record spreadsheet → [createFoldersAndUpdateSheet every 5 min] → Update folders + submission status
Auto-share spreadsheet → [autoShareStudentFolders every 5 min] → Share student folders
Submission records → [generateOverdueAssignments every 1 min] → Overdue list spreadsheet
```

---

## 2. Monitoring Automatic Triggers

### How to view trigger status

1. Go to [script.google.com](https://script.google.com) → open the main system Apps Script project
2. Click the **⏱ Triggers** icon (clock icon) in the left panel
3. A list of all active triggers will be displayed

### Expected triggers (healthy state)

| Function name | Frequency | Purpose |
|--------------|-----------|---------|
| `sortStudentAssignments` | Every 1 minute | Moves uploaded student files to Pending Homework |
| `distributeHomework` | Every 15 minutes | Distributes marked work back to students |
| `createFoldersAndUpdateSheet` | Every 5 minutes | Updates folder structure and submission status |
| `generateOverdueAssignments` | Every 1 minute | Refreshes the overdue assignment list |
| `autoShareStudentFolders` | Every 5 minutes | Shares student folders with their Google accounts |

### Symptoms of trigger failure
- Submission records stop updating
- Uploaded files remain in the "Upload Link" folder and are never moved
- Marked homework is not automatically returned to students

### Resolution
1. In the spreadsheet menu, click **☁️ Zhiyun System** → **🗑️ Delete all triggers**
2. Then run `setupTriggers()` manually in the Apps Script editor (select the function and click Run)

---

## 3. Reading Error Logs

### In Apps Script

1. Go to [script.google.com](https://script.google.com) → open the main system project
2. Click **⚡ Executions** in the left panel
3. This shows all trigger and manual execution history, including:
   - Execution time
   - Result (completed / failed)
   - Error messages (if any)

### Common error messages

| Error message | Likely cause |
|--------------|-------------|
| `DriveApp: Access denied` | A folder has been deleted or moved |
| `Spreadsheet ... not found` | Incorrect or deleted spreadsheet ID |
| `Service invoked too many times` | Trigger frequency exceeded Google's quota |
| `Cannot read property ... of null` | Missing system property — re-initialization needed |
| `Drive.Permissions.create ... failed` | Drive API not enabled, or the student email account doesn't exist |

---

## 4. Google Drive Folder Health Check

### Routine checks

| Folder | Normal state | Problem indicator |
|--------|-------------|------------------|
| 1. Upload Link (Students) | Usually empty (files moved automatically) | Files accumulating → trigger failure |
| 2. Pending Homework | Student work present, sorted by class | No subfolders → class setup issue |
| 3. Teacher Feedback | Usually empty (files distributed quickly) | Files accumulating → `distributeHomework` trigger failure |
| 4. Returned Homework | Subfolders per class/student/category | Students can't find work → auto-share issue |

### Verify folder IDs
If you suspect a folder ID is invalid, run this diagnostic in the Apps Script editor:

```javascript
function checkFolderIds() {
  const props = PropertiesService.getUserProperties();
  ['UPLOAD_FOLDER_ID','PENDING_FOLDER_ID','FEEDBACK_FOLDER_ID','RETURNED_FOLDER_ID'].forEach(k => {
    try {
      const name = DriveApp.getFolderById(props.getProperty(k)).getName();
      Logger.log(k + ': OK (' + name + ')');
    } catch(e) {
      Logger.log(k + ': ERROR - ' + e.message);
    }
  });
}
```

Open the Logs panel (View → Logs) to see results.

---

## 5. Spreadsheet Monitoring

### Key spreadsheets

| Spreadsheet | Purpose | What to check |
|-------------|---------|--------------|
| 帙雲 - 繳交紀錄及課業佈置 | Homework assignments and submission status | One sheet per class; A1 has class name; students listed from A4 |
| 帙雲 - 自動共用、收集位址 | Student account IDs and folder links | Column C should contain folder URLs; "共用失敗" entries need attention |
| 帙雲 - OverdueAssignments | Overdue assignment list | Check regularly; should update frequently if triggers are healthy |

---

## 6. Common Issues & Solutions

### Issue 1: System completely stops working
**Symptoms:** All features unresponsive; dashboard shows "System not initialized"  
**Resolution:**  
1. Run `checkFolderIds()` in Apps Script (see Section 4)
2. If folder IDs are invalid, use the spreadsheet menu to reset installation status, then re-initialize

### Issue 2: Trigger quota exhausted
**Symptoms:** Execution log shows many "Service invoked too many times" errors  
**Resolution:** Reduce trigger frequency. Edit `setupTriggers()` in `code.gs` to increase intervals (e.g., change `everyMinutes(1)` to `everyMinutes(5)`)

### Issue 3: Drive API quota exceeded
**Symptoms:** Auto-share stops; logs show Drive API errors  
**Resolution:** Google has daily Drive API quotas. With many students, consider adding batch logic to `autoShareStudentFolders()` to process fewer folders per run.

### Issue 4: Students see outdated version of the submission app
**Resolution:** In Apps Script → Deploy → Manage Deployments → Edit → change version to "New version"

### Issue 5: `createFoldersAndUpdateSheet` runs slowly / times out
**Cause:** Too many folders or files in Drive causes long execution times  
**Resolution:** Google Apps Script has a 6-minute execution limit. For large classes, consider processing one class sheet per trigger run rather than all sheets at once.

---

## 7. System Reset Procedures

### Soft reset (properties only)
1. Spreadsheet menu → **⚠️ Reset installation status**
2. Re-run initialization  
**Impact:** Regenerates system properties; existing Drive folders and spreadsheets are unaffected

### Full reset (use with caution)
1. In Apps Script, run `deleteAllTriggers()`
2. In Apps Script, run `forceReset()`
3. Manually delete the "📁 帙雲" folder in Google Drive (**all data will be lost**)
4. Re-run initialization  
**Impact:** Complete system wipe — all student data, records, and folders are permanently deleted

---

## 8. Security Notes

- The **teacher dashboard URL** should be kept confidential — never share it with students
- The **student submission URL** is safe to share with students (contains no teacher functionality)
- The system relies on URL secrecy for access control (no password protection by default)
- If the teacher URL is compromised, redeploy with "New version" to get a new URL
- Consider restricting the teacher app's access to "Anyone with a Google account" (rather than "Anyone including anonymous") to prevent unauthorized access

---

## 9. System Properties Reference

The following properties are stored in `UserProperties` of the **main system** Apps Script project:

| Property name | Description |
|--------------|-------------|
| `IS_INSTALLED` | `"true"` indicates the system has been initialized |
| `UPLOAD_FOLDER_ID` | Student upload folder ID |
| `PENDING_FOLDER_ID` | Pending homework folder ID |
| `FEEDBACK_FOLDER_ID` | Teacher feedback folder ID |
| `RETURNED_FOLDER_ID` | Returned homework folder ID |
| `AUTO_SHARE_SHEET_ID` | Auto-share spreadsheet ID |
| `RECORD_SHEET_ID` | Submission record spreadsheet ID |
| `OVERDUE_SHEET_ID` | Overdue assignments spreadsheet ID |
| `SUBJECT_CONFIG` | Subject and category configuration (JSON format) |

The following properties are stored in the **student submission app's** `UserProperties`:

| Property name | Description |
|--------------|-------------|
| `UPLOAD_FOLDER_ID` | Same as the main system's `UPLOAD_FOLDER_ID` |
| `RECORD_SHEET_ID` | Same as the main system's `RECORD_SHEET_ID` |
