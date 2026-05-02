# 帙雲 (Zhiyun) — Developer Setup Guide

> **Language:** English | [粵語版本 → setup-yue.md](./setup-yue.md)

This guide walks a developer through cloning the repository, deploying the project to Google Apps Script, and completing the initial system installation. Follow every step in order.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Option A — Manual Setup via the Apps Script Editor](#3-option-a--manual-setup-via-the-apps-script-editor)
4. [Option B — clasp (Command-Line Workflow)](#4-option-b--clasp-command-line-workflow)
5. [Enable the Drive API v3 Advanced Service](#5-enable-the-drive-api-v3-advanced-service)
6. [Deploy as a Web App](#6-deploy-as-a-web-app)
7. [Run the Installation Wizard](#7-run-the-installation-wizard)
8. [Initial Configuration](#8-initial-configuration)
9. [Customise the Email Domain](#9-customise-the-email-domain)
10. [Verifying the Deployment](#10-verifying-the-deployment)
11. [Making Changes & Redeploying](#11-making-changes--redeploying)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| Google account | Must own the Google Drive where the system will be installed |
| Google Workspace (optional) | Recommended for school deployments; Drive API v3 advanced service is available on all accounts |
| Node.js ≥ 18 | Required only for the **clasp** workflow (Option B) |
| `git` | For cloning the repository |
| GitHub access | To clone `kychugo/homework-submission-system` |

> The system runs entirely inside Google Apps Script — no server, database, or paid infrastructure is required.

---

## 2. Repository Structure

```
homework-submission-system/
├── code.gs          Main script: Web App entry point, triggers, all business logic
├── setup.gs         Installation wizard functions (onOpen menu, installZhiyun)
├── record.gs        Server-side data provider for the submission record dashboard
├── Index.html       Teacher control panel (root URL)
├── homework.html    Homework assignment form (?page=homework)
├── student.html     Student submission panel (?page=submit)
├── record.html      Submission status dashboard (?page=record)
├── config.html      Category/subject settings panel (?page=config)
├── autoshare.html   Auto-share management panel (?page=autoshare)
└── docs/            Documentation (this file lives here)
```

### Key Google resources created at install time

| Resource | Name |
|----------|------|
| Drive root folder | `📁 帙雲` |
| Upload folder | `1. 上傳課業Link（學生）` |
| Pending-review folder | `2. 待批改課業` |
| Teacher feedback folder | `3. 老師回饋區` |
| Returned homework folder | `4. 已發還課業` |
| Submission record sheet | `帙雲 - 繳交紀錄及課業佈置` |
| Auto-share sheet | `帙雲 - 自動共用、收集位址` |
| Overdue assignments sheet | `帙雲 - OverdueAssignments` |

---

## 3. Option A — Manual Setup via the Apps Script Editor

This is the simplest path and requires no local tooling beyond a browser.

### Step 1 — Create a Google Spreadsheet (installer spreadsheet)

1. Go to [Google Sheets](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Name it something memorable, e.g. `帙雲 安裝檔`.

### Step 2 — Open the Apps Script editor

1. In the spreadsheet, click **「擴充功能」 (Extensions) → 「Apps Script」**.
2. The Apps Script IDE will open in a new tab.

### Step 3 — Copy the source files

For each file in the repository, create a corresponding file in the Apps Script project:

#### Script files (`.gs`)

The project starts with one default script file (`Code.gs`). You will need to add more.

1. **Replace `Code.gs`** with the contents of `code.gs` from this repository:
   - Click the default `Code.gs` file.
   - Select all text (Ctrl+A / Cmd+A) and delete it.
   - Paste the full contents of `code.gs`.

2. **Add `setup.gs`**:
   - Click **「+」** next to "Files" → **「Script」**.
   - Name it `setup` (Apps Script adds `.gs` automatically).
   - Paste the full contents of `setup.gs`.

3. **Add `record.gs`**:
   - Repeat the above, name it `record`, paste the contents of `record.gs`.

#### HTML files

For each `.html` file, click **「+」** next to "Files" → **「HTML」**, name it (without the `.html` extension), and paste the contents:

| Apps Script file name | Source file |
|-----------------------|-------------|
| `Index` | `Index.html` |
| `homework` | `homework.html` |
| `student` | `student.html` |
| `record` | `record.html` |
| `config` | `config.html` |
| `autoshare` | `autoshare.html` |

> ⚠️ File names are **case-sensitive** in Apps Script. Use the exact names shown in the table above.

### Step 4 — Save the project

Click the **💾 Save** button (or press Ctrl+S / Cmd+S). All files must be saved before you can deploy.

---

## 4. Option B — clasp (Command-Line Workflow)

[clasp](https://github.com/google/clasp) is Google's official CLI for pushing code to Apps Script. Use this option if you want to develop locally and push changes via Git.

### Step 1 — Install clasp

```bash
npm install -g @google/clasp
```

### Step 2 — Enable the Apps Script API

1. Go to [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings).
2. Toggle **"Google Apps Script API"** to **On**.

### Step 3 — Log in

```bash
clasp login
```

A browser window will open for Google OAuth. Authorise with the Google account you will use for the deployment.

### Step 4 — Clone the repository

```bash
git clone https://github.com/kychugo/homework-submission-system.git
cd homework-submission-system
```

### Step 5 — Create a new Apps Script project linked to a spreadsheet

1. Create a blank Google Spreadsheet (same as Option A, Step 1).
2. Copy the spreadsheet ID from its URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. Create the Apps Script project:
   ```bash
   clasp create --type sheets --parentId SPREADSHEET_ID --title "帙雲 安裝檔"
   ```
   This creates a `.clasp.json` file in the current directory.

### Step 6 — Configure `.clasp.json`

Ensure `.clasp.json` looks like this (the `scriptId` will be filled by clasp):

```json
{
  "scriptId": "<YOUR_SCRIPT_ID>",
  "rootDir": "."
}
```

### Step 7 — Push files to Apps Script

```bash
clasp push
```

clasp uses the `appsscript.json` manifest. If the repository does not include one, create a minimal `appsscript.json` at the project root:

```json
{
  "timeZone": "Asia/Hong_Kong",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Drive",
        "version": "v3",
        "serviceId": "drive"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Then push again:

```bash
clasp push
```

> **Tip:** Run `clasp push --watch` during active development to auto-push on every file save.

---

## 5. Enable the Drive API v3 Advanced Service

The auto-share feature requires the Drive API v3 advanced service. This must be enabled **manually** in the Apps Script editor regardless of which setup option you used.

1. Open the Apps Script editor.
2. In the left sidebar, click **「服務」 (Services)** (the `+` icon).
3. Find **"Drive API"** in the list.
4. Ensure the version is set to **`v3`**.
5. Click **「新增」 (Add)**.

If this step is skipped, folder sharing will fail with `Exception: Drive is not defined`.

---

## 6. Deploy as a Web App

1. In the Apps Script editor, click **「部署」 (Deploy) → 「新增部署作業」 (New deployment)**.
2. Click the **⚙️ gear icon** next to "Select type" and choose **「網頁應用程式」 (Web app)**.
3. Configure:

   | Setting | Recommended value |
   |---------|-------------------|
   | Description | `v1` (or any version label) |
   | Execute as | **Me** (the account that owns the spreadsheet) |
   | Who has access | **Anyone** (required so students can submit without signing in) |

4. Click **「部署」 (Deploy)**.
5. **Copy the Web App URL** — you will need this for the teacher control panel and for the student submission link.

> ⚠️ The **"Execute as: Me"** setting means the script runs with your Google account's permissions. If you later delete or move folders, you may need to update User Properties (see the [Technician Guide](./technician-guide-en.md)).

---

## 7. Run the Installation Wizard

The installation wizard creates all required Drive folders and spreadsheets automatically.

1. Return to the installer spreadsheet (the one you created in Step 1/5).
2. Refresh the page. A new menu **「☁️ 帙雲系統」** will appear in the menu bar.
3. Click **「☁️ 帙雲系統」 → 「🚀 一鍵初始化系統 (僅初次執行)」**.
4. A permission prompt will appear — click **「審查權限」 (Review permissions)** and grant all requested permissions.
5. Click **「確定」** on the confirmation dialog.
6. Wait approximately 60 seconds for the wizard to complete.
7. On success, the spreadsheet will be populated with links to all created resources.

### What the wizard creates

```
📁 帙雲/
├── 1. 上傳課業Link（學生）/
├── 2. 待批改課業/
├── 3. 老師回饋區/
├── 4. 已發還課業/
├── 帙雲 - 繳交紀錄及課業佈置  (Google Sheet)
├── 帙雲 - 自動共用、收集位址   (Google Sheet)
├── 帙雲 - OverdueAssignments   (Google Sheet)
└── [installer spreadsheet]    (moved here automatically)
```

It also registers **5 time-driven triggers**:

| Function | Frequency |
|----------|-----------|
| `sortStudentAssignments` | Every 1 minute |
| `distributeHomework` | Every 15 minutes |
| `createFoldersAndUpdateSheet` | Every 5 minutes |
| `generateOverdueAssignments` | Every 1 minute |
| `autoShareStudentFolders` | Every 5 minutes |

---

## 8. Initial Configuration

### Add students to the record sheet

1. Open `帙雲 - 繳交紀錄及課業佈置`.
2. The first sheet tab is named `1A` with a sample student (`陳大文`) already in cell A4. Replace or extend this:
   - **A1**: Class name (e.g. `1A`)
   - **A4 onwards**: One student name per row
3. To add another class, click **+** at the bottom of the sheet, name the tab (e.g. `2B`), and set **A1** to `2B`, then list students from A4.

### Register students for auto-share

1. Open `帙雲 - 自動共用、收集位址`.
2. Starting from row 2, add one student per row:
   - **Column A**: Student ID (e.g. `s001`)
   - **Column B**: Student's full name (must match exactly the name in the record sheet)
   - **Column C**: Leave blank — the system fills this with the folder URL automatically

### Share the student submission link

From the Web App URL (copied in Step 6), append `?page=submit`:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=submit
```

Share this URL with students. Keep the root URL (`…/exec`) private for teachers only.

---

## 9. Customise the Email Domain

The system is pre-configured for the domain `ccckyc.edu.hk`. To deploy for a different school, update `code.gs` in two places:

```javascript
// In autoShareStudentFolders():
const email = `${studentId}@YOUR_SCHOOL_DOMAIN`;

// In generateOverdueAssignments():
// Update the email column value to use your domain
```

After editing, **save** and **redeploy the Web App** (create a new deployment version):
1. Click **「部署」 → 「管理部署作業」 (Manage deployments)**.
2. Click the **✏️ pencil** icon next to the existing deployment.
3. Change the version to **「新版本」 (New version)**.
4. Click **「部署」**.

---

## 10. Verifying the Deployment

Run through this checklist after completing setup:

- [ ] Open the **Teacher Control Panel URL** in a browser — it should load without the "系統尚未初始化" error
- [ ] Check that all 4 Drive folders appear in `📁 帙雲`
- [ ] Open the **Apps Script Triggers panel** and confirm 5 triggers are listed
- [ ] Open the **Student Submission Link** (`?page=submit`) in an incognito window — the submission form should load
- [ ] Check **「帙雲 - 繳交紀錄及課業佈置」** has the correct class tab(s) and student names
- [ ] Assign a test homework via the Control Panel → **「課業設置」** and wait 5 minutes — the corresponding folder should appear in `2. 待批改課業`

---

## 11. Making Changes & Redeploying

### clasp workflow

```bash
# Edit files locally
clasp push           # push changes to Apps Script
# Then redeploy via the Apps Script editor UI
```

### Browser-only workflow

1. Edit files directly in the Apps Script editor.
2. Save (Ctrl+S / Cmd+S).
3. Redeploy with a new version (see Section 9 for steps).

> ⚠️ An existing Web App URL **does not** automatically serve the new code until you create a new deployment version. Always create a new version when deploying functional changes.

### Running functions manually for testing

In the Apps Script editor, select any function name from the function dropdown and click **「執行」 (Run)** to execute it immediately. This is useful for testing `sortStudentAssignments`, `distributeHomework`, etc. without waiting for a trigger.

---

## 12. Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| "系統尚未初始化" on Web App | Installation wizard not run | Run `installZhiyun()` via the spreadsheet menu |
| Permission denied after re-running | `IS_INSTALLED` flag is set | Run **「⚠️ 重置安裝狀態」** first, then reinstall |
| `Drive is not defined` error | Drive API v3 service not enabled | Enable in Apps Script → Services (see Section 5) |
| Triggers not running | Triggers panel empty | Run `setupTriggers()` manually from the editor |
| Files not sorted after upload | Filename format wrong | Filename must contain a valid class name (e.g. `1A`) |
| Auto-share shows "共用失敗" | Student email doesn't exist | Verify student ID and domain are correct |
| clasp push fails with auth error | Login session expired | Run `clasp login` again |
| Web App returns 403 | "Who has access" set to wrong value | Redeploy with "Anyone" access |

---

*For day-to-day teacher usage, see [teacher-guide-en.md](./teacher-guide-en.md).*  
*For student usage, see [student-guide-en.md](./student-guide-en.md).*  
*For ongoing system monitoring, see [technician-guide-en.md](./technician-guide-en.md).*
