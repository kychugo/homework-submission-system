# Zhiyun Homework System — Setup, Deployment & Student Configuration Guide (English)

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Deploy the Teacher System (Main App)](#3-deploy-the-teacher-system-main-app)
4. [Deploy the Student Submission App](#4-deploy-the-student-submission-app)
5. [Initialize the System](#5-initialize-the-system)
6. [Add Students (Auto-Share Setup)](#6-add-students-auto-share-setup)
7. [Configure Subjects & Categories](#7-configure-subjects--categories)
8. [Updating & Resetting](#8-updating--resetting)
9. [FAQ](#9-faq)

---

## 1. System Overview

The Zhiyun system consists of two independent Google Apps Script web applications:

| System | Purpose | Users |
|--------|---------|-------|
| **Main (Teacher) App** | Assign homework, view submission records, manage student folders, auto-share | Teachers |
| **Student Submission App** | Submit homework (select class, name, assignment, upload files) | Students |

Both apps share the same Google Drive backend but are deployed separately. Students can only access the student app — they cannot see teacher-only features.

---

## 2. Prerequisites

**Required Google account conditions:**
- A Google account (school account recommended for the teacher)
- Google Drive and Google Sheets must be enabled for the account

**Tools needed:**
- A web browser (Chrome recommended)
- All source files from this GitHub repository

---

## 3. Deploy the Teacher System (Main App)

### Step 1: Create a Google Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename the project to: `Zhiyun Main System`

### Step 2: Copy the source files

Copy each file's content into the Apps Script editor:

| Source file | Apps Script name |
|------------|-----------------|
| `code.gs` | `code.gs` (default file, overwrite) |
| `Index.html` | New HTML file → name it `Index` |
| `homework.html` | New HTML file → name it `homework` |
| `record.gs` (HTML content) | New HTML file → name it `record` |
| `config.html` | New HTML file → name it `config` |
| `autoshare.html` | New HTML file → name it `autoshare` |
| `setup.gs` | New script file → name it `setup` |

> **Tip**: Click the **+** next to "Files" on the left sidebar to add new files.

### Step 3: Enable the Drive Advanced Service

1. In the Apps Script left panel, click the **+** next to "Services"
2. Find **Drive API**, enable it (use version `v3`)
3. Click **Add**

### Step 4: Deploy as a web app

1. Click **Deploy** → **New deployment**
2. Choose deployment type: **Web app**
3. Configure:
   - **Execute as**: Me (teacher's account)
   - **Who has access**: Anyone with a Google account *(or adjust per school policy)*
4. Click **Deploy** and copy the generated **Web App URL** (this is the teacher dashboard URL)

### Step 5: Attach to a spreadsheet (for the menu)

1. Open a Google Sheet (create a new one or use existing)
2. Click **Extensions** → **Apps Script**
3. Copy the contents of `setup.gs` into that script
4. Save and refresh the sheet — the **☁️ Zhiyun System** menu will appear at the top

---

## 4. Deploy the Student Submission App

The student app requires a **separate, independent Apps Script project**.

### Step 1: Create a new Apps Script project

1. Go to [script.google.com](https://script.google.com) → New project
2. Name it: `Zhiyun Student Submit`

### Step 2: Copy the student system files

| Source file | Apps Script name |
|------------|-----------------|
| `student.gs` | `code.gs` (overwrite the default blank file) |
| `student_submit.html` | New HTML file → name it `student_submit` |

### Step 3: Set script properties

1. Click **⚙ Project Settings** in the left panel
2. Scroll down to **Script Properties** → click **Add property**
3. Add these two properties:

   | Property name | Value |
   |--------------|-------|
   | `UPLOAD_FOLDER_ID` | The ID of the "1. 上傳課業Link（學生）" folder in Drive |
   | `RECORD_SHEET_ID` | The ID of the "帙雲 - 繳交紀錄及課業佈置" spreadsheet |

> **How to find a folder/spreadsheet ID?**
> Open the item in Google Drive. The ID is the string of letters and numbers after `/folders/` or `/d/` in the URL.
> Example: `https://drive.google.com/drive/folders/1aBcD...XyZ` → ID is `1aBcD...XyZ`

### Step 4: Deploy as a web app

1. Click **Deploy** → **New deployment** → type: **Web app**
2. Configure:
   - **Execute as**: Me
   - **Who has access**: **Anyone (including anonymous)** ← Important! Allows students without Google accounts to submit
3. Copy the **Student Submission URL** — this URL is safe to share with students

---

## 5. Initialize the System

The first time you use the main system, you must run initialization:

1. Open the Google Sheet that has `setup.gs` attached
2. Click **☁️ Zhiyun System** → **🚀 One-click initialization**
3. Wait approximately 1 minute. The system will create:
   - 📁 帙雲 (root folder)
     - 1. Upload Link (Students)
     - 2. Pending Homework
     - 3. Teacher Feedback
     - 4. Returned Homework
   - Auto-share spreadsheet
   - Submission record spreadsheet
   - Overdue assignments spreadsheet
4. When done, the spreadsheet will display links to all created resources

---

## 6. Add Students (Auto-Share Setup)

Configure folder sharing so each student receives access to their returned-homework folder.

### Method 1: Auto-Share Management Panel (recommended)

1. Go to the teacher dashboard → click **Auto-Share Management**
2. Enter each student's **Student ID** and **Name** → click **Add Student**
3. Once all students are added, click **Run Auto-Share Now**

### Method 2: Directly edit the spreadsheet

Open the "帙雲 - 自動共用、收集位址" spreadsheet, enter student IDs in column A, and names (exactly matching the record spreadsheet) in column B.

> **Note:** The student ID must be the prefix of the student's Google account email (e.g., ID `21001` → `21001@ccckyc.edu.hk`). To change the domain, edit the `@ccckyc.edu.hk` string in `code.gs`.

---

## 7. Configure Subjects & Categories

1. Go to the teacher dashboard → click **Subject/Category Settings**
2. Click **➕ Add Subject**, enter a subject name (e.g., English, Maths)
3. Within each subject card, click **➕ Add Category** to add homework categories
4. Click **💾 Save Settings** when done

The system defaults to one subject ("中文") with three categories.

---

## 8. Updating & Resetting

- **Update code**: Paste new code in the Apps Script editor, then redeploy (Manage deployments → Edit → change version to "New version")
- **Reset installation**: Click **⚠️ Reset installation status** in the spreadsheet menu, then run initialization again  
  (**Warning**: This only resets the script properties — it does NOT delete any files in Drive)

---

## 9. FAQ

**Q: Initialization fails with "No permission"**  
A: Make sure Drive API (v3) is enabled under Services.

**Q: Auto-share shows "共用失敗 (share failed)"**  
A: Check that the student ID corresponds to an existing Google account and that Drive API is enabled.

**Q: Students cannot open the submission page**  
A: Verify the student app's access is set to "Anyone (including anonymous)".

**Q: Students still see the old version after a code update**  
A: When redeploying, always choose "New version" — not "Use existing version".

**Q: How do I add a new class?**  
A: In the "帙雲 - 繳交紀錄及課業佈置" spreadsheet, add a new sheet (tab), put the class name in cell A1, and list student names from A4 onwards.
